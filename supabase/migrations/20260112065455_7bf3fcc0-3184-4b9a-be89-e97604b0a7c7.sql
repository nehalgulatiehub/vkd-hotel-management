-- Add new status values to po_status enum
ALTER TYPE po_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE po_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE po_status ADD VALUE IF NOT EXISTS 'rejected';