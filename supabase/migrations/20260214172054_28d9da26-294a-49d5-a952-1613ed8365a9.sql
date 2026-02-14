
-- Telemetry readings (imported from Excel monthly)
CREATE TABLE public.telemetry_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate TEXT NOT NULL,
  vehicle_label TEXT NOT NULL DEFAULT '',
  month_ref DATE NOT NULL, -- first day of the month
  km_start INTEGER NOT NULL DEFAULT 0,
  km_end INTEGER NOT NULL DEFAULT 0,
  km_total INTEGER GENERATED ALWAYS AS (km_end - km_start) STORED,
  days_available INTEGER NOT NULL DEFAULT 30,
  days_in_maintenance INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plate, month_ref)
);
ALTER TABLE public.telemetry_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD telemetry_readings" ON public.telemetry_readings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add franchise_km column to vehicles
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS franchise_km INTEGER NOT NULL DEFAULT 5000;
