-- ============================================
-- GIO910 - ROW LEVEL SECURITY POLICIES
-- Versi: 1.0.0
-- Tanggal: 2026-11-26
-- Deskripsi: Kebijakan RLS untuk keamanan data
-- ============================================

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users dapat melihat profil mereka sendiri
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Users dapat update profil mereka sendiri
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Pemilik dan Manajemen dapat melihat semua user
CREATE POLICY "Pemilik and Manajemen can view all users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Pemilik', 'Manajemen')
  )
);

-- Pemilik dan Manajemen dapat update semua user
CREATE POLICY "Pemilik and Manajemen can update all users"
ON users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Pemilik', 'Manajemen')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Pemilik', 'Manajemen')
  )
);

-- ============================================
-- SESSIONS TABLE POLICIES
-- ============================================

-- Users dapat melihat sesi mereka sendiri
CREATE POLICY "Users can view own sessions"
ON sessions FOR SELECT
USING (auth.uid() = user_id);

-- Users dapat delete sesi mereka sendiri
CREATE POLICY "Users can delete own sessions"
ON sessions FOR DELETE
USING (auth.uid() = user_id);

-- Pemilik dan Manajemen dapat melihat semua sesi
CREATE POLICY "Pemilik and Manajemen can view all sessions"
ON sessions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Pemilik', 'Manajemen')
  )
);

-- ============================================
-- OTP_CODES TABLE POLICIES
-- ============================================

-- Users dapat melihat OTP mereka sendiri
CREATE POLICY "Users can view own OTP codes"
ON otp_codes FOR SELECT
USING (auth.uid() = user_id);

-- Users dapat create OTP untuk email mereka
CREATE POLICY "Users can create OTP for own email"
ON otp_codes FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE email = otp_codes.email 
    AND id = auth.uid()
  )
);

-- Users dapat update OTP mereka sendiri (untuk mark as used)
CREATE POLICY "Users can update own OTP codes"
ON otp_codes FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  NEW.status = 'used' AND 
  OLD.status = 'pending'
);

-- ============================================
-- PIN_CODES TABLE POLICIES
-- ============================================

-- Users dapat melihat PIN mereka sendiri
CREATE POLICY "Users can view own PIN codes"
ON pin_codes FOR SELECT
USING (auth.uid() = user_id);

-- Users dapat create/update PIN mereka sendiri
CREATE POLICY "Users can manage own PIN codes"
ON pin_codes FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- AUDIT_LOGS TABLE POLICIES
-- ============================================

-- Auditor dapat melihat semua audit logs
CREATE POLICY "Auditor can view all audit logs"
ON audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'Auditor'
  )
);

-- Pemilik dan Manajemen dapat melihat semua audit logs
CREATE POLICY "Pemilik and Manajemen can view all audit logs"
ON audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Pemilik', 'Manajemen')
  )
);

-- Users dapat melihat audit logs yang terkait dengan mereka
CREATE POLICY "Users can view own audit logs"
ON audit_logs FOR SELECT
USING (auth.uid() = user_id);

-- ============================================
-- CONFIGURATIONS TABLE POLICIES
-- ============================================

-- Public configurations (tidak sensitif)
CREATE POLICY "Public configurations"
ON configurations FOR SELECT
USING (is_encrypted = FALSE);

-- Pemilik dan Manajemen dapat melihat semua konfigurasi
CREATE POLICY "Pemilik and Manajemen can view all configurations"
ON configurations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Pemilik', 'Manajemen')
  )
);

-- Pemilik dapat update semua konfigurasi
CREATE POLICY "Pemilik can update all configurations"
ON configurations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'Pemilik'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'Pemilik'
  )
);

-- ============================================
-- BACKUP_LOGS TABLE POLICIES
-- ============================================

-- Pemilik dan Manajemen dapat melihat semua backup logs
CREATE POLICY "Pemilik and Manajemen can view all backup logs"
ON backup_logs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Pemilik', 'Manajemen')
  )
);

-- Users dapat melihat backup yang mereka buat
CREATE POLICY "Users can view own backups"
ON backup_logs FOR SELECT
USING (auth.uid() = user_id);

-- ============================================
-- IDEMPOTENCY_KEYS TABLE POLICIES
-- ============================================

-- Semua user dapat create dan read idempotency keys
CREATE POLICY "All users can create idempotency keys"
ON idempotency_keys FOR INSERT
WITH CHECK (TRUE);

CREATE POLICY "All users can read idempotency keys"
ON idempotency_keys FOR SELECT
USING (TRUE);

-- ============================================
-- GOOGLE_SHEETS_SYNC TABLE POLICIES
-- ============================================

-- Pemilik dan Manajemen dapat manage sync
CREATE POLICY "Pemilik and Manajemen can manage sheets sync"
ON google_sheets_sync FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Pemilik', 'Manajemen')
  )
);

-- ============================================
-- GOOGLE_DRIVE_FILES TABLE POLICIES
-- ============================================

-- Public files (jika di-share)
CREATE POLICY "Public drive files"
ON google_drive_files FOR SELECT
USING (metadata->>'is_public' = 'true');

-- Users dapat melihat file mereka sendiri
CREATE POLICY "Users can view own drive files"
ON google_drive_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()
  )
);

-- Pemilik dan Manajemen dapat melihat semua file
CREATE POLICY "Pemilik and Manajemen can view all drive files"
ON google_drive_files FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Pemilik', 'Manajemen')
  )
);

-- ============================================
-- GOOGLE_CALENDAR_EVENTS TABLE POLICIES
-- ============================================

-- Public events
CREATE POLICY "Public calendar events"
ON google_calendar_events FOR SELECT
USING (metadata->>'is_public' = 'true');

-- Users dapat melihat event mereka sendiri
CREATE POLICY "Users can view own calendar events"
ON google_calendar_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()
  )
);

-- ============================================
-- PRODUCTS TABLE POLICIES
-- ============================================

-- Public products (published)
CREATE POLICY "Public can view published products"
ON products FOR SELECT
USING (is_active = TRUE AND is_published = TRUE);

-- Users dapat melihat semua products
CREATE POLICY "Authenticated users can view all products"
ON products FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()
  )
);

-- Staf, Manajemen, Pemilik dapat create/update products
CREATE POLICY "Staf and above can manage products"
ON products FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Pemilik', 'Manajemen', 'Staf')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Pemilik', 'Manajemen', 'Staf')
  )
);

-- ============================================
-- TRANSACTIONS TABLE POLICIES
-- ============================================

-- Users dapat melihat transaksi mereka sendiri
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
USING (
  auth.uid() = created_by OR 
  auth.uid() = customer_id OR 
  auth.uid() = vendor_id
);

-- Staf, Manajemen, Pemilik dapat melihat semua transaksi
CREATE POLICY "Staf and above can view all transactions"
ON transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Pemilik', 'Manajemen', 'Staf')
  )
);

-- Create transactions (dengan validasi)
CREATE POLICY "Users can create own transactions"
ON transactions FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND 
  (
    -- Jika transaksi memerlukan approval, cek role
    (requires_approval = FALSE) OR
    (requires_approval = TRUE AND 
     EXISTS (
       SELECT 1 FROM users 
       WHERE id = auth.uid() 
       AND role IN ('Pemilik', 'Manajemen', 'Staf')
     )
    )
  )
);

-- Update transactions (hanya untuk approval/rejection)
CREATE POLICY "Approvers can update transactions"
ON transactions FOR UPDATE
USING (
  -- Requested by dapat cancel draft
  (auth.uid() = requested_by AND OLD.status = 'draft' AND NEW.status = 'cancelled') OR
  -- Approver dapat approve/reject
  (auth.uid() = approved_by AND OLD.status IN ('pending', 'draft') AND NEW.status IN ('approved', 'rejected')) OR
  -- Second approver untuk dual control
  (auth.uid() = second_approver AND OLD.status = 'approved' AND NEW.status = 'completed') OR
  -- Pemilik dan Manajemen dapat update semua
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Pemilik', 'Manajemen')
  )
)
WITH CHECK (
  -- Validasi status transitions
  (
    -- Draft -> Pending
    (OLD.status = 'draft' AND NEW.status = 'pending') OR
    -- Pending -> Approved/Rejected
    (OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected')) OR
    -- Approved -> Completed (dengan dual control)
    (OLD.status = 'approved' AND NEW.status = 'completed' AND 
     (OLD.requires_dual_control = FALSE OR NEW.second_approver IS NOT NULL)) OR
    -- Draft -> Cancelled
    (OLD.status = 'draft' AND NEW.status = 'cancelled' AND auth.uid() = OLD.requested_by) OR
    -- Pemilik/Manajemen dapat override
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('Pemilik', 'Manajemen')
    )
  )
);

-- ============================================
-- DOCUMENTS TABLE POLICIES
-- ============================================

-- Public documents
CREATE POLICY "Public can view published documents"
ON documents FOR SELECT
USING (is_published = TRUE);

-- Authenticated users dapat melihat semua documents
CREATE POLICY "Authenticated users can view all documents"
ON documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()
  )
);

-- Staf, Manajemen, Pemilik dapat manage documents
CREATE POLICY "Staf and above can manage documents"
ON documents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Pemilik', 'Manajemen', 'Staf')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Pemilik', 'Manajemen', 'Staf')
  )
);

-- ============================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================

-- Users dapat melihat notifikasi mereka sendiri
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users dapat mark as read notifikasi mereka
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  (NEW.is_read = TRUE OR NEW.read_at IS NOT NULL)
);

-- ============================================
-- FUNGSI PENDUKUNG UNTUK RLS
-- ============================================

-- Fungsi untuk cek apakah user adalah auditor
CREATE OR REPLACE FUNCTION is_auditor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'Auditor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi untuk cek apakah user adalah pemilik atau manajemen
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Pemilik', 'Manajemen')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi untuk cek apakah user adalah staf ke atas
CREATE OR REPLACE FUNCTION is_staff_or_above()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('Pemilik', 'Manajemen', 'Staf')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER UNTUK AUDIT LOG
-- ============================================

-- Trigger untuk otomatis log perubahan data
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
  old_val JSONB;
  new_val JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    old_val := NULL;
    new_val := to_jsonb(NEW);
    
    INSERT INTO audit_logs (
      user_id, action, entity_type, entity_id, 
      old_value, new_value, metadata
    ) VALUES (
      auth.uid(), 'create', TG_TABLE_NAME, NEW.id,
      old_val, new_val, 
      jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    old_val := to_jsonb(OLD);
    new_val := to_jsonb(NEW);
    
    INSERT INTO audit_logs (
      user_id, action, entity_type, entity_id,
      old_value, new_value, changes, metadata
    ) VALUES (
      auth.uid(), 'update', TG_TABLE_NAME, NEW.id,
      old_val, new_val,
      jsonb_object_agg(key, jsonb_build_object('old', OLD."key", 'new', NEW."key")),
      jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
    );
    
  ELSIF TG_OP = 'DELETE' THEN
    old_val := to_jsonb(OLD);
    new_val := NULL;
    
    INSERT INTO audit_logs (
      user_id, action, entity_type, entity_id,
      old_value, new_value, metadata
    ) VALUES (
      auth.uid(), 'delete', TG_TABLE_NAME, OLD.id,
      old_val, new_val,
      jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
    );
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tambahkan trigger ke tabel-tabel utama
CREATE TRIGGER audit_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_transactions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_products_trigger
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_documents_trigger
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_configurations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON configurations
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();
