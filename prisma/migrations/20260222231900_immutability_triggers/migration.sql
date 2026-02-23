-- Prevent UPDATE or DELETE on records when status = 'RECORDED'
CREATE OR REPLACE FUNCTION prevent_recorded_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'RECORDED' THEN
      RAISE EXCEPTION 'Cannot delete a RECORDED record';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'RECORDED' THEN
      RAISE EXCEPTION 'Cannot update a RECORDED record';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_record_immutability
  BEFORE UPDATE OR DELETE ON records
  FOR EACH ROW
  EXECUTE FUNCTION prevent_recorded_mutation();

-- Prevent ALL UPDATE and DELETE on audit_logs (append-only)
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable. Cannot % audit log entries.', TG_OP;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_audit_log_immutability
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_mutation();
