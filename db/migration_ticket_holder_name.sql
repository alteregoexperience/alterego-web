-- Guarda el titular de cada entrada de forma independiente al comprador.
-- Se mantiene nullable para que las entradas historicas sigan obteniendo el
-- nombre desde la orden o desde los metadatos originales de Stripe.

BEGIN;

ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS holder_name text;

COMMIT;
