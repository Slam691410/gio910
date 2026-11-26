// ============================================
// GIO910 - MAIN API EDGE FUNCTION
// Versi: 1.0.0
// Tanggal: 2026-11-26
// Deskripsi: API utama untuk menggantikan Google Apps Script
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'
import { GoogleAuth, google } from 'https://esm.sh/google-auth-library@8.9.0'

// ============================================
// KONFIGURASI
// ============================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Inisialisasi Supabase Client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Google OAuth Config
const googleServiceAccount = {
  client_email: Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL') || '',
  private_key: Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY')?.replace(/\\n/g, '\n') || '',
}

// Linear API Config
const linearApiKey = Deno.env.get('LINEAR_API_KEY') || ''

// Notion API Config
const notionApiKey = Deno.env.get('NOTION_API_KEY') || ''

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate OTP
function generateOTP(length: number = 6): string {
  const chars = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += chars[Math.floor(Math.random() * chars.length)]
  }
  return otp
}

// Hash PIN
async function hashPIN(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + salt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Verify PIN
async function verifyPIN(pin: string, hash: string, salt: string): Promise<boolean> {
  const newHash = await hashPIN(pin, salt)
  return newHash === hash
}

// Get Google Auth Client
async function getGoogleAuth() {
  const auth = new GoogleAuth({
    credentials: googleServiceAccount,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/gmail.send',
    ],
  })
  return auth
}

// Log audit
async function logAudit(
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  oldValue: any = null,
  newValue: any = null,
  metadata: any = {}
) {
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      user_id: userId,
      action: action as any,
      entity_type: entityType as any,
      entity_id: entityId,
      old_value: oldValue,
      new_value: newValue,
      metadata: metadata,
    })
  
  if (error) {
    console.error('Audit log error:', error)
  }
}

// Get configuration
async function getConfig(key: string) {
  const { data, error } = await supabase
    .from('configurations')
    .select('value')
    .eq('key', key)
    .single()
  
  if (error) return null
  return data?.value
}

// ============================================
// MAIN SERVER
// ============================================

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url, method, headers } = req
    const path = new URL(url).pathname
    const body = method !== 'GET' && method !== 'DELETE' 
      ? await req.json() 
      : null
    
    // Get auth token from header
    const authHeader = headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    // Get session
    let session = null
    let user = null
    
    if (token) {
      const { data: { session: currentSession }, error: sessionError } = 
        await supabase.auth.getSession()
      
      if (!sessionError) {
        session = currentSession
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session?.user?.id || '')
          .single()
        
        if (!userError) {
          user = userData
        }
      }
    }

    // ============================================
    // ROUTES
    // ============================================

    // ========== AUTH ROUTES ==========

    // POST /api/auth/send-otp
    if (method === 'POST' && path === '/api/auth/send-otp') {
      const { email, type = 'email' } = body || {}
      
      if (!email) {
        return new Response(JSON.stringify({ error: 'Email required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Cek OTP max attempts
      const otpMaxReq = await getConfig('OTP_MAX_REQ_15MIN') || 5
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000)
      
      const { count: recentOtpCount, error: countError } = await supabase
        .from('otp_codes')
        .select('*', { count: 'exact', head: true })
        .eq('email', email)
        .gte('created_at', fifteenMinAgo.toISOString())
      
      if (countError) throw countError
      
      if (recentOtpCount && recentOtpCount > otpMaxReq) {
        return new Response(JSON.stringify({ 
          error: 'Too many OTP requests, please wait 15 minutes' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Generate OTP
      const otpCode = generateOTP()
      const otpTtl = await getConfig('OTP_TTL_SEC') || 300
      const expiresAt = new Date(Date.now() + otpTtl * 1000)
      
      // Simpan OTP
      const { error: otpError } = await supabase
        .from('otp_codes')
        .insert({
          email: email,
          code: otpCode,
          type: type,
          expires_at: expiresAt.toISOString(),
        })
      
      if (otpError) throw otpError

      // Kirim OTP via email (simulasi, nanti pakai Gmail API)
      console.log(`OTP for ${email}: ${otpCode}`)
      
      // Log audit
      await logAudit(user?.id || null, 'create', 'otp', null, null, {
        email, type
      })

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'OTP sent successfully' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST /api/auth/verify-otp
    if (method === 'POST' && path === '/api/auth/verify-otp') {
      const { email, code, type = 'email' } = body || {}
      
      if (!email || !code) {
        return new Response(JSON.stringify({ error: 'Email and code required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Cek OTP
      const { data: otpData, error: otpError } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .eq('type', type)
        .eq('status', 'pending')
        .gte('expires_at', new Date().toISOString())
        .single()
      
      if (otpError || !otpData) {
        return new Response(JSON.stringify({ error: 'Invalid or expired OTP' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Cek max attempts
      if (otpData.attempts >= otpData.max_attempts) {
        return new Response(JSON.stringify({ error: 'Maximum attempts reached' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Update OTP status
      const { error: updateError } = await supabase
        .from('otp_codes')
        .update({
          status: 'used',
          used_at: new Date().toISOString(),
          attempts: otpData.attempts + 1,
        })
        .eq('id', otpData.id)
      
      if (updateError) throw updateError

      // Buat session
      const sessionTtl = await getConfig('SESSION_HOURS') || 8
      const sessionExpiresAt = new Date(Date.now() + sessionTtl * 60 * 60 * 1000)
      
      // Get or create user
      let userId: string
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()
      
      if (existingUser) {
        userId = existingUser.id
      } else {
        // Buat user baru
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            email: email,
            role: 'Tamu',
            is_verified: true,
          })
          .select('id')
          .single()
        
        if (userError) throw userError
        userId = newUser.id
      }

      // Generate session token
      const sessionToken = crypto.randomUUID()
      const refreshToken = crypto.randomUUID()
      
      const { error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          token: sessionToken,
          refresh_token: refreshToken,
          expires_at: sessionExpiresAt.toISOString(),
          ip_address: headers.get('x-forwarded-for') || '',
          user_agent: headers.get('user-agent') || '',
        })
      
      if (sessionError) throw sessionError

      // Update last login
      await supabase
        .from('users')
        .update({
          last_login_at: new Date().toISOString(),
          login_attempts: 0,
        })
        .eq('id', userId)

      // Log audit
      await logAudit(userId, 'login', 'session', null, null, {
        email, ip: headers.get('x-forwarded-for')
      })

      return new Response(JSON.stringify({ 
        success: true,
        token: sessionToken,
        refresh_token: refreshToken,
        expires_at: sessionExpiresAt.toISOString(),
        user_id: userId,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST /api/auth/refresh
    if (method === 'POST' && path === '/api/auth/refresh') {
      const { refresh_token } = body || {}
      
      if (!refresh_token) {
        return new Response(JSON.stringify({ error: 'Refresh token required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Cek refresh token
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('refresh_token', refresh_token)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .single()
      
      if (sessionError || !sessionData) {
        return new Response(JSON.stringify({ error: 'Invalid refresh token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Generate new tokens
      const sessionTtl = await getConfig('SESSION_HOURS') || 8
      const newExpiresAt = new Date(Date.now() + sessionTtl * 60 * 60 * 1000)
      const newToken = crypto.randomUUID()
      const newRefreshToken = crypto.randomUUID()
      
      // Update session
      const { error: updateError } = await supabase
        .from('sessions')
        .update({
          token: newToken,
          refresh_token: newRefreshToken,
          expires_at: newExpiresAt.toISOString(),
        })
        .eq('id', sessionData.id)
      
      if (updateError) throw updateError

      return new Response(JSON.stringify({ 
        success: true,
        token: newToken,
        refresh_token: newRefreshToken,
        expires_at: newExpiresAt.toISOString(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST /api/auth/logout
    if (method === 'POST' && path === '/api/auth/logout') {
      if (!token) {
        return new Response(JSON.stringify({ error: 'Token required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Hapus session
      const { error: deleteError } = await supabase
        .from('sessions')
        .update({ status: 'revoked' })
        .eq('token', token)
      
      if (deleteError) throw deleteError

      // Log audit
      await logAudit(user?.id || null, 'logout', 'session', null)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ========== PIN ROUTES ==========

    // POST /api/auth/set-pin
    if (method === 'POST' && path === '/api/auth/set-pin') {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { pin, confirm_pin } = body || {}
      
      if (!pin || pin !== confirm_pin) {
        return new Response(JSON.stringify({ error: 'PIN confirmation failed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (pin.length !== 6) {
        return new Response(JSON.stringify({ error: 'PIN must be 6 digits' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Generate salt
      const salt = crypto.randomUUID()
      const pinHash = await hashPIN(pin, salt)
      
      // Simpan PIN
      const { error: pinError } = await supabase
        .from('pin_codes')
        .upsert({
          user_id: user.id,
          pin_hash: pinHash,
          salt: salt,
          is_active: true,
          failed_attempts: 0,
        })
      
      if (pinError) throw pinError

      // Log audit
      await logAudit(user.id, 'create', 'pin', null)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST /api/auth/verify-pin
    if (method === 'POST' && path === '/api/auth/verify-pin') {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { pin } = body || {}
      
      if (!pin) {
        return new Response(JSON.stringify({ error: 'PIN required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Get PIN data
      const { data: pinData, error: pinError } = await supabase
        .from('pin_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()
      
      if (pinError || !pinData) {
        return new Response(JSON.stringify({ error: 'PIN not set' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Cek lock
      if (pinData.locked_until && new Date(pinData.locked_until) > new Date()) {
        return new Response(JSON.stringify({ 
          error: `PIN locked until ${pinData.locked_until}` 
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Verify PIN
      const isValid = await verifyPIN(pin, pinData.pin_hash, pinData.salt)
      
      if (!isValid) {
        const maxFail = await getConfig('PIN_MAX_FAIL') || 5
        const lockMin = await getConfig('PIN_LOCK_MIN') || 15
        
        const newFailedAttempts = pinData.failed_attempts + 1
        const lockedUntil = newFailedAttempts >= maxFail 
          ? new Date(Date.now() + lockMin * 60 * 1000) 
          : null
        
        await supabase
          .from('pin_codes')
          .update({
            failed_attempts: newFailedAttempts,
            locked_until: lockedUntil,
          })
          .eq('id', pinData.id)

        return new Response(JSON.stringify({ 
          error: `Invalid PIN. ${newFailedAttempts >= maxFail ? 'Account locked' : `${maxFail - newFailedAttempts} attempts remaining`}` 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Reset failed attempts
      await supabase
        .from('pin_codes')
        .update({
          failed_attempts: 0,
          locked_until: null,
        })
        .eq('id', pinData.id)

      // Log audit
      await logAudit(user.id, 'verify', 'pin', null)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ========== GOOGLE SHEETS ROUTES ==========

    // GET /api/google/sheets/:sheetId
    if (method === 'GET' && path.startsWith('/api/google/sheets/')) {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const sheetId = path.split('/').pop()
      const { range = 'Sheet1!A:Z' } = new URL(url).searchParams
      
      try {
        const auth = await getGoogleAuth()
        const sheets = google.sheets({ version: 'v4', auth })
        
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: range,
        })

        // Log audit
        await logAudit(user.id, 'read', 'google_sheet', sheetId, null, {
          range, row_count: response.data.values?.length
        })

        return new Response(JSON.stringify({ 
          success: true,
          data: response.data.values || [],
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          error: error.message || 'Failed to fetch sheet data' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // POST /api/google/sheets/sync
    if (method === 'POST' && path === '/api/google/sheets/sync') {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { sheet_id, range, target_table } = body || {}
      
      if (!sheet_id || !target_table) {
        return new Response(JSON.stringify({ error: 'sheet_id and target_table required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      try {
        const auth = await getGoogleAuth()
        const sheets = google.sheets({ version: 'v4', auth })
        
        // Get sheet data
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: sheet_id,
          range: range || 'Sheet1!A:Z',
        })

        const values = response.data.values || []
        
        if (values.length === 0) {
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'No data to sync',
            row_count: 0
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Get headers (row pertama)
        const headers = values[0]
        const dataRows = values.slice(1)
        
        // Prepare data untuk insert
        const dataToInsert = dataRows.map((row: any[]) => {
          const obj: Record<string, any> = {}
          headers.forEach((header, index) => {
            obj[header] = row[index] || null
          })
          return obj
        })

        // Insert ke Supabase
        const { error: insertError } = await supabase
          .from(target_table)
          .insert(dataToInsert)
        
        if (insertError) throw insertError

        // Log sync
        await supabase
          .from('google_sheets_sync')
          .insert({
            sheet_id: sheet_id,
            sheet_name: range || 'Sheet1',
            range: range || 'Sheet1!A:Z',
            last_sync_at: new Date().toISOString(),
            sync_status: 'completed',
            row_count: dataRows.length,
            metadata: { synced_by: user.id }
          })

        // Log audit
        await logAudit(user.id, 'sync', 'google_sheet', sheet_id, null, {
          target_table, row_count: dataRows.length
        })

        return new Response(JSON.stringify({ 
          success: true,
          synced_rows: dataRows.length,
          target_table: target_table,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error: any) {
        // Log error
        await supabase
          .from('google_sheets_sync')
          .insert({
            sheet_id: sheet_id,
            sheet_name: range || 'Sheet1',
            range: range || 'Sheet1!A:Z',
            last_sync_at: new Date().toISOString(),
            sync_status: 'failed',
            sync_error: error.message,
            metadata: { synced_by: user.id }
          })

        return new Response(JSON.stringify({ 
          error: error.message || 'Sync failed' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // ========== GOOGLE DRIVE ROUTES ==========

    // POST /api/google/drive/upload
    if (method === 'POST' && path === '/api/google/drive/upload') {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { file_name, file_data, folder_id, mime_type } = body || {}
      
      if (!file_name || !file_data) {
        return new Response(JSON.stringify({ error: 'file_name and file_data required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      try {
        const auth = await getGoogleAuth()
        const drive = google.drive({ version: 'v3', auth })
        
        // Decode base64 file data
        const fileBuffer = Buffer.from(file_data, 'base64')
        
        const fileMetadata = {
          name: file_name,
          parents: folder_id ? [folder_id] : [],
        }

        const media = {
          mimeType: mime_type || 'application/octet-stream',
          body: fileBuffer,
        }

        const response = await drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id, name, webViewLink, webContentLink, size, mimeType, createdTime',
        })

        const file = response.data

        // Simpan ke database
        await supabase
          .from('google_drive_files')
          .insert({
            google_file_id: file.id,
            file_name: file.name,
            file_type: 'uploaded',
            mime_type: file.mimeType,
            folder_id: folder_id || null,
            file_size: parseInt(file.size || '0'),
            file_url: file.webViewLink,
            download_url: file.webContentLink,
            metadata: { uploaded_by: user.id }
          })

        // Log audit
        await logAudit(user.id, 'create', 'google_drive_file', file.id)

        return new Response(JSON.stringify({ 
          success: true,
          file_id: file.id,
          file_name: file.name,
          file_url: file.webViewLink,
          download_url: file.webContentLink,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          error: error.message || 'Upload failed' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // GET /api/google/drive/files
    if (method === 'GET' && path === '/api/google/drive/files') {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { folder_id, limit = 50, offset = 0 } = new URL(url).searchParams
      
      try {
        const { data: files, error: dbError } = await supabase
          .from('google_drive_files')
          .select('*')
          .eq('folder_id', folder_id || null)
          .range(offset, offset + limit - 1)
          .order('created_at', { ascending: false })
        
        if (dbError) throw dbError

        // Log audit
        await logAudit(user.id, 'read', 'google_drive_file', null, null, {
          count: files?.length
        })

        return new Response(JSON.stringify({ 
          success: true,
          files: files || [],
          count: files?.length || 0,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          error: error.message || 'Failed to fetch files' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // ========== GOOGLE CALENDAR ROUTES ==========

    // POST /api/google/calendar/events
    if (method === 'POST' && path === '/api/google/calendar/events') {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { 
        summary, 
        description, 
        start_time, 
        end_time, 
        location,
        attendees = [],
        recurrence
      } = body || {}
      
      if (!summary || !start_time || !end_time) {
        return new Response(JSON.stringify({ 
          error: 'summary, start_time, and end_time required' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      try {
        const auth = await getGoogleAuth()
        const calendar = google.calendar({ version: 'v3', auth })
        
        const event = {
          summary: summary,
          description: description || '',
          start: { dateTime: start_time, timeZone: 'Asia/Jakarta' },
          end: { dateTime: end_time, timeZone: 'Asia/Jakarta' },
          location: location || '',
          attendees: attendees.map((attendee: string) => ({ email: attendee })),
          ...(recurrence && { recurrence: [recurrence] }),
        }

        const response = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: event,
        })

        const googleEvent = response.data

        // Simpan ke database
        await supabase
          .from('google_calendar_events')
          .insert({
            google_event_id: googleEvent.id,
            calendar_id: 'primary',
            title: googleEvent.summary || '',
            description: googleEvent.description || '',
            start_time: googleEvent.start?.dateTime || '',
            end_time: googleEvent.end?.dateTime || '',
            location: googleEvent.location || '',
            attendees: googleEvent.attendees || [],
            status: googleEvent.status || 'confirmed',
            recurrence: googleEvent.recurrence || null,
            metadata: { created_by: user.id }
          })

        // Log audit
        await logAudit(user.id, 'create', 'google_calendar_event', googleEvent.id)

        return new Response(JSON.stringify({ 
          success: true,
          event_id: googleEvent.id,
          html_link: googleEvent.htmlLink,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          error: error.message || 'Failed to create event' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // GET /api/google/calendar/events
    if (method === 'GET' && path === '/api/google/calendar/events') {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { start_date, end_date, limit = 50, offset = 0 } = new URL(url).searchParams
      
      try {
        const auth = await getGoogleAuth()
        const calendar = google.calendar({ version: 'v3', auth })
        
        const response = await calendar.events.list({
          calendarId: 'primary',
          timeMin: start_date || new Date().toISOString(),
          timeMax: end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          maxResults: limit,
          singleEvents: true,
          orderBy: 'startTime',
        })

        const events = response.data.items || []

        // Log audit
        await logAudit(user.id, 'read', 'google_calendar_event', null, null, {
          count: events.length
        })

        return new Response(JSON.stringify({ 
          success: true,
          events: events,
          count: events.length,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          error: error.message || 'Failed to fetch events' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // ========== GMAIL ROUTES ==========

    // POST /api/google/gmail/send
    if (method === 'POST' && path === '/api/google/gmail/send') {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { to, subject, body, html_body, cc, bcc, attachments = [] } = body || {}
      
      if (!to || !subject || (!body && !html_body)) {
        return new Response(JSON.stringify({ 
          error: 'to, subject, and body/html_body required' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      try {
        const auth = await getGoogleAuth()
        const gmail = google.gmail({ version: 'v1', auth })
        
        // Create raw email
        const email = `To: ${Array.isArray(to) ? to.join(', ') : to}\n` +
          (cc ? `Cc: ${Array.isArray(cc) ? cc.join(', ') : cc}\n` : '') +
          (bcc ? `Bcc: ${Array.isArray(bcc) ? bcc.join(', ') : bcc}\n` : '') +
          `Subject: ${subject}\n` +
          `Content-Type: text/${html_body ? 'html' : 'plain'}; charset=utf-8\n\n` +
          (html_body || body)
        
        const rawEmail = Buffer.from(email).toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '')
        
        const response = await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: rawEmail,
          },
        })

        // Log audit
        await logAudit(user.id, 'create', 'gmail_message', response.data.id, null, {
          to, subject
        })

        return new Response(JSON.stringify({ 
          success: true,
          message_id: response.data.id,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          error: error.message || 'Failed to send email' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // ========== LINEAR ROUTES ==========

    // POST /api/linear/issues
    if (method === 'POST' && path === '/api/linear/issues') {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { title, description, team_id, priority = 2, labels = [] } = body || {}
      
      if (!title || !team_id) {
        return new Response(JSON.stringify({ error: 'title and team_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!linearApiKey) {
        return new Response(JSON.stringify({ error: 'Linear API not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      try {
        const query = `
          mutation IssueCreate($input: IssueCreateInput!) {
            issueCreate(input: $input) {
              success
              issue {
                id
                url
                number
                title
              }
            }
          }
        `

        const variables = {
          input: {
            title: title,
            description: description || '',
            teamId: team_id,
            priority: priority,
            labels: labels,
          }
        }

        const response = await fetch('https://api.linear.app/graphql', {
          method: 'POST',
          headers: {
            'Authorization': linearApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, variables }),
        })

        const result = await response.json()

        if (result.errors) {
          throw new Error(result.errors[0].message)
        }

        // Log audit
        await logAudit(user.id, 'create', 'linear_issue', result.data.issueCreate.issue.id, null, {
          title, team_id
        })

        return new Response(JSON.stringify({ 
          success: true,
          issue: result.data.issueCreate.issue,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          error: error.message || 'Failed to create Linear issue' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // GET /api/linear/issues
    if (method === 'GET' && path === '/api/linear/issues') {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { team_id, limit = 50, offset = 0 } = new URL(url).searchParams
      
      if (!linearApiKey) {
        return new Response(JSON.stringify({ error: 'Linear API not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      try {
        const query = `
          query Issues($teamId: String, $limit: Int!, $offset: Int!) {
            issues(
              first: $limit
              skip: $offset
              filter: { team: { id: { eq: $teamId } } }
            ) {
              nodes {
                id
                url
                number
                title
                description
                priority
                status
                labels {
                  nodes {
                    name
                  }
                }
                createdAt
                updatedAt
              }
              pageInfo {
                hasNextPage
                hasPreviousPage
              }
            }
          }
        `

        const variables = {
          teamId: team_id || null,
          limit: limit,
          offset: offset,
        }

        const response = await fetch('https://api.linear.app/graphql', {
          method: 'POST',
          headers: {
            'Authorization': linearApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, variables }),
        })

        const result = await response.json()

        if (result.errors) {
          throw new Error(result.errors[0].message)
        }

        // Log audit
        await logAudit(user.id, 'read', 'linear_issue', null, null, {
          count: result.data.issues.nodes.length
        })

        return new Response(JSON.stringify({ 
          success: true,
          issues: result.data.issues.nodes,
          page_info: result.data.issues.pageInfo,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          error: error.message || 'Failed to fetch Linear issues' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // ========== NOTION ROUTES ==========

    // POST /api/notion/pages
    if (method === 'POST' && path === '/api/notion/pages') {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { database_id, title, content, properties = {} } = body || {}
      
      if (!database_id || !title) {
        return new Response(JSON.stringify({ error: 'database_id and title required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!notionApiKey) {
        return new Response(JSON.stringify({ error: 'Notion API not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      try {
        const response = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${notionApiKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
          body: JSON.stringify({
            parent: { database_id: database_id },
            properties: {
              Title: {
                title: [{ text: { content: title } }]
              },
              ...properties,
            },
            children: content ? [
              {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                  rich_text: [{ text: { content: content } }]
                }
              }
            ] : [],
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || 'Failed to create Notion page')
        }

        // Log audit
        await logAudit(user.id, 'create', 'notion_page', result.id, null, {
          title, database_id
        })

        return new Response(JSON.stringify({ 
          success: true,
          page_id: result.id,
          url: result.url,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          error: error.message || 'Failed to create Notion page' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // ========== PRODUCTS ROUTES ==========

    // GET /api/products
    if (method === 'GET' && path === '/api/products') {
      const { limit = 50, offset = 0, search, category, is_active } = new URL(url).searchParams
      
      try {
        let query = supabase
          .from('products')
          .select('*')
          .range(offset, offset + limit - 1)
          .order('created_at', { ascending: false })

        if (search) {
          query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
        }
        
        if (category) {
          query = query.eq('category', category)
        }
        
        if (is_active !== null) {
          query = query.eq('is_active', is_active === 'true')
        }

        const { data: products, error: productsError, count } = await query
        
        if (productsError) throw productsError

        return new Response(JSON.stringify({ 
          success: true,
          products: products || [],
          total: count || 0,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          error: error.message || 'Failed to fetch products' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // POST /api/products
    if (method === 'POST' && path === '/api/products') {
      if (!user || !['Pemilik', 'Manajemen', 'Staf'].includes(user.role)) {
        return new Response(JSON.stringify({ error: 'Unauthorized - Staf or above required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const productData = body || {}
      
      // Validasi required fields
      if (!productData.name || !productData.price) {
        return new Response(JSON.stringify({ error: 'name and price required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      try {
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert({
            ...productData,
            created_by: user.id,
            updated_by: user.id,
          })
          .select('*')
          .single()
        
        if (productError) throw productError

        // Log audit
        await logAudit(user.id, 'create', 'product', product.id, null, product)

        return new Response(JSON.stringify({ 
          success: true,
          product: product,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          error: error.message || 'Failed to create product' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // ========== TRANSACTIONS ROUTES ==========

    // POST /api/transactions
    if (method === 'POST' && path === '/api/transactions') {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const transactionData = body || {}
      
      // Validasi required fields
      if (!transactionData.type || !transactionData.amount) {
        return new Response(JSON.stringify({ error: 'type and amount required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      try {
        // Cek apakah memerlukan approval (4 eyes principle)
        const fourEyesThreshold = await getConfig('FOUR_EYES_IDR') || 100000000
        const requiresApproval = transactionData.amount >= fourEyesThreshold
        
        // Cek apakah memerlukan dual control
        const dualControlThreshold = await getConfig('DUAL_CONTROL_IDR') || 5000000
        const requiresDualControl = transactionData.amount >= dualControlThreshold
        
        // Generate transaction number
        const transactionNumber = `GIO-${Date.now()}-${Math.floor(Math.random() * 10000)}`
        
        // Calculate totals
        const taxAmount = transactionData.tax_amount || 0
        const discountAmount = transactionData.discount_amount || 0
        const totalAmount = transactionData.amount + taxAmount - discountAmount
        
        const { data: transaction, error: transactionError } = await supabase
          .from('transactions')
          .insert({
            transaction_number: transactionNumber,
            type: transactionData.type,
            amount: transactionData.amount,
            tax_amount: taxAmount,
            discount_amount: discountAmount,
            total_amount: totalAmount,
            description: transactionData.description || '',
            status: requiresApproval ? 'pending' : 'draft',
            requires_approval: requiresApproval,
            requires_dual_control: requiresDualControl,
            requested_by: user.id,
            created_by: user.id,
            updated_by: user.id,
          })
          .select('*')
          .single()
        
        if (transactionError) throw transactionError

        // Log audit
        await logAudit(user.id, 'create', 'transaction', transaction.id, null, {
          amount: transaction.total_amount,
          requires_approval: requiresApproval,
        })

        return new Response(JSON.stringify({ 
          success: true,
          transaction: transaction,
          message: requiresApproval 
            ? 'Transaction requires approval' 
            : 'Transaction created',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          error: error.message || 'Failed to create transaction' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // POST /api/transactions/:id/approve
    if (method === 'POST' && path.match(/^\/api\/transactions\/[^\/]+\/approve$/)) {
      if (!user || !['Pemilik', 'Manajemen'].includes(user.role)) {
        return new Response(JSON.stringify({ error: 'Unauthorized - Manajemen or Pemilik required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const transactionId = path.split('/')[3]
      const { notes } = body || {}
      
      try {
        // Get transaction
        const { data: transaction, error: fetchError } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', transactionId)
          .single()
        
        if (fetchError || !transaction) {
          return new Response(JSON.stringify({ error: 'Transaction not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Cek status
        if (transaction.status !== 'pending' && transaction.status !== 'draft') {
          return new Response(JSON.stringify({ 
            error: `Cannot approve transaction with status: ${transaction.status}` 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Cek apakah memerlukan dual control
        if (transaction.requires_dual_control) {
          // Update dengan status approved (menunggu second approval)
          const { error: updateError } = await supabase
            .from('transactions')
            .update({
              status: 'approved',
              approved_by: user.id,
              approved_at: new Date().toISOString(),
              updated_by: user.id,
            })
            .eq('id', transactionId)
          
          if (updateError) throw updateError

          // Log audit
          await logAudit(user.id, 'update', 'transaction', transactionId, transaction, {
            new_status: 'approved',
            notes
          })

          return new Response(JSON.stringify({ 
            success: true,
            message: 'Transaction approved, waiting for second approval (dual control)',
            transaction: { ...transaction, status: 'approved' },
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } else {
          // Tidak memerlukan dual control, langsung complete
          const { error: updateError } = await supabase
            .from('transactions')
            .update({
              status: 'completed',
              approved_by: user.id,
              approved_at: new Date().toISOString(),
              updated_by: user.id,
            })
            .eq('id', transactionId)
          
          if (updateError) throw updateError

          // Log audit
          await logAudit(user.id, 'update', 'transaction', transactionId, transaction, {
            new_status: 'completed',
            notes
          })

          return new Response(JSON.stringify({ 
            success: true,
            message: 'Transaction approved and completed',
            transaction: { ...transaction, status: 'completed' },
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          error: error.message || 'Failed to approve transaction' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // POST /api/transactions/:id/second-approve
    if (method === 'POST' && path.match(/^\/api\/transactions\/[^\/]+\/second-approve$/)) {
      if (!user || !['Pemilik', 'Manajemen'].includes(user.role)) {
        return new Response(JSON.stringify({ error: 'Unauthorized - Manajemen or Pemilik required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const transactionId = path.split('/')[3]
      const { notes } = body || {}
      
      try {
        // Get transaction
        const { data: transaction, error: fetchError } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', transactionId)
          .single()
        
        if (fetchError || !transaction) {
          return new Response(JSON.stringify({ error: 'Transaction not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Cek status dan apakah sudah approved
        if (transaction.status !== 'approved') {
          return new Response(JSON.stringify({ 
            error: `Cannot second approve transaction with status: ${transaction.status}` 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        if (!transaction.requires_dual_control) {
          return new Response(JSON.stringify({ 
            error: 'Transaction does not require dual control' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Cek apakah user berbeda dengan approved_by (maker != checker)
        if (transaction.approved_by === user.id) {
          return new Response(JSON.stringify({ 
            error: 'Second approver must be different from first approver (maker != checker)' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Update ke completed
        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            status: 'completed',
            second_approver: user.id,
            second_approved_at: new Date().toISOString(),
            updated_by: user.id,
          })
          .eq('id', transactionId)
        
        if (updateError) throw updateError

        // Log audit
        await logAudit(user.id, 'update', 'transaction', transactionId, transaction, {
          new_status: 'completed',
          notes,
          action: 'second_approve'
        })

        return new Response(JSON.stringify({ 
          success: true,
          message: 'Transaction second approved and completed (dual control)',
          transaction: { ...transaction, status: 'completed' },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          error: error.message || 'Failed to second approve transaction' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // POST /api/transactions/:id/reject
    if (method === 'POST' && path.match(/^\/api\/transactions\/[^\/]+\/reject$/)) {
      if (!user || !['Pemilik', 'Manajemen'].includes(user.role)) {
        return new Response(JSON.stringify({ error: 'Unauthorized - Manajemen or Pemilik required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const transactionId = path.split('/')[3]
      const { reason } = body || {}
      
      if (!reason) {
        return new Response(JSON.stringify({ error: 'Rejection reason required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      try {
        // Get transaction
        const { data: transaction, error: fetchError } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', transactionId)
          .single()
        
        if (fetchError || !transaction) {
          return new Response(JSON.stringify({ error: 'Transaction not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Cek status
        if (transaction.status !== 'pending' && transaction.status !== 'draft') {
          return new Response(JSON.stringify({ 
            error: `Cannot reject transaction with status: ${transaction.status}` 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Update status
        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            status: 'rejected',
            rejection_reason: reason,
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            updated_by: user.id,
          })
          .eq('id', transactionId)
        
        if (updateError) throw updateError

        // Log audit
        await logAudit(user.id, 'update', 'transaction', transactionId, transaction, {
          new_status: 'rejected',
          reason
        })

        return new Response(JSON.stringify({ 
          success: true,
          message: 'Transaction rejected',
          transaction: { ...transaction, status: 'rejected' },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          error: error.message || 'Failed to reject transaction' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // ========== DOCUMENTS ROUTES ==========

    // GET /api/documents
    if (method === 'GET' && path === '/api/documents') {
      const { limit = 50, offset = 0, type, category, search, is_published } = new URL(url).searchParams
      
      try {
        let query = supabase
          .from('documents')
          .select('*')
          .range(offset, offset + limit - 1)
          .order('created_at', { ascending: false })

        if (type) {
          query = query.eq('document_type', type)
        }
        
        if (category) {
          query = query.eq('category', category)
        }
        
        if (search) {
          query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
        }
        
        if (is_published !== null) {
          query = query.eq('is_published', is_published === 'true')
        }

        const { data: documents, error: documentsError, count } = await query
        
        if (documentsError) throw documentsError

        return new Response(JSON.stringify({ 
          success: true,
          documents: documents || [],
          total: count || 0,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          error: error.message || 'Failed to fetch documents' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // ========== CONFIGURATIONS ROUTES ==========

    // GET /api/configurations
    if (method === 'GET' && path === '/api/configurations') {
      try {
        const { data: configs, error: configsError } = await supabase
          .from('configurations')
          .select('*')
          .eq('is_encrypted', false)
        
        if (configsError) throw configsError

        // Format response
        const formattedConfigs: Record<string, any> = {}
        configs?.forEach(config => {
          formattedConfigs[config.key] = config.value
        })

        return new Response(JSON.stringify({ 
          success: true,
          configurations: formattedConfigs,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          error: error.message || 'Failed to fetch configurations' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // ========== NOTIFICATIONS ROUTES ==========

    // GET /api/notifications
    if (method === 'GET' && path === '/api/notifications') {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { limit = 20, offset = 0, is_read } = new URL(url).searchParams
      
      try {
        let query = supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .range(offset, offset + limit - 1)
          .order('created_at', { ascending: false })

        if (is_read !== null) {
          query = query.eq('is_read', is_read === 'true')
        }

        const { data: notifications, error: notificationsError, count } = await query
        
        if (notificationsError) throw notificationsError

        return new Response(JSON.stringify({ 
          success: true,
          notifications: notifications || [],
          total: count || 0,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          error: error.message || 'Failed to fetch notifications' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // POST /api/notifications/mark-read
    if (method === 'POST' && path === '/api/notifications/mark-read') {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { notification_id } = body || {}
      
      if (!notification_id) {
        return new Response(JSON.stringify({ error: 'notification_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      try {
        const { error: updateError } = await supabase
          .from('notifications')
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
          })
          .eq('id', notification_id)
          .eq('user_id', user.id)
        
        if (updateError) throw updateError

        return new Response(JSON.stringify({ 
          success: true,
          message: 'Notification marked as read',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          error: error.message || 'Failed to mark notification as read' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // ========== AUDIT LOGS ROUTES ==========

    // GET /api/audit-logs
    if (method === 'GET' && path === '/api/audit-logs') {
      if (!user || !['Pemilik', 'Manajemen', 'Auditor'].includes(user.role)) {
        return new Response(JSON.stringify({ error: 'Unauthorized - Auditor or above required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { 
        limit = 50, 
        offset = 0, 
        action, 
        entity_type, 
        user_id,
        start_date,
        end_date
      } = new URL(url).searchParams
      
      try {
        let query = supabase
          .from('audit_logs')
          .select('*')
          .range(offset, offset + limit - 1)
          .order('created_at', { ascending: false })

        // Filter by user role
        if (user.role === 'Auditor') {
          // Auditor bisa melihat semua
        } else if (user.role === 'Manajemen') {
          // Manajemen bisa melihat semua
        } else if (user.role === 'Pemilik') {
          // Pemilik bisa melihat semua
        } else {
          // Lainnya hanya bisa melihat audit log mereka sendiri
          query = query.eq('user_id', user.id)
        }

        if (action) {
          query = query.eq('action', action)
        }
        
        if (entity_type) {
          query = query.eq('entity_type', entity_type)
        }
        
        if (user_id) {
          query = query.eq('user_id', user_id)
        }
        
        if (start_date) {
          query = query.gte('created_at', start_date)
        }
        
        if (end_date) {
          query = query.lte('created_at', end_date)
        }

        const { data: auditLogs, error: auditError, count } = await query
        
        if (auditError) throw auditError

        return new Response(JSON.stringify({ 
          success: true,
          audit_logs: auditLogs || [],
          total: count || 0,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          error: error.message || 'Failed to fetch audit logs' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // ========== HEALTH CHECK ==========

    // GET /api/health
    if (method === 'GET' && path === '/api/health') {
      return new Response(JSON.stringify({ 
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ========== 404 HANDLER ==========

    return new Response(JSON.stringify({ 
      error: 'Endpoint not found',
      path: path,
      method: method,
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Server error:', error)
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
