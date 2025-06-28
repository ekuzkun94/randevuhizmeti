-- Service-Provider Junction Table
CREATE TABLE IF NOT EXISTS public.service_providers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
    provider_id uuid REFERENCES public.providers(id) ON DELETE CASCADE,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_providers_service_id ON public.service_providers(service_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_provider_id ON public.service_providers(provider_id);

-- Sample Data (mapping each service to its provider)
INSERT INTO public.service_providers (service_id, provider_id, is_active)
VALUES
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', true),
  ('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', true),
  ('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', true),
  ('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001', true),
  ('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440002', true),
  ('880e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440002', true),
  ('880e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440002', true),
  ('880e8400-e29b-41d4-a716-446655440008', '770e8400-e29b-41d4-a716-446655440003', true),
  ('880e8400-e29b-41d4-a716-446655440009', '770e8400-e29b-41d4-a716-446655440003', true),
  ('880e8400-e29b-41d4-a716-446655440010', '770e8400-e29b-41d4-a716-446655440003', true); 