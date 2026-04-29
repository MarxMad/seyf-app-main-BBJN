# Etherfuse Programmatic - Comandos de Prueba

Guía de smoke tests para validar el flujo:

1. KYC identidad
2. KYC documentos
3. Bank account (CLABE)
4. Agreements
5. Readiness final para habilitar onramp

> Nota: los comandos asumen `npm run dev` activo en `http://localhost:3000`.

---

## 1) Variables y cookie jar

```bash
export BASE_URL="http://localhost:3000"
export COOKIE_JAR="/tmp/seyf_kyc_cookie.txt"
rm -f "$COOKIE_JAR" && touch "$COOKIE_JAR"
```

Extraer la wallet de prueba desde `.env`:

```bash
export PUBKEY="$(python3 - <<'PY'
from pathlib import Path
for line in Path('.env').read_text().splitlines():
    line=line.strip()
    if not line or line.startswith('#') or '=' not in line:
        continue
    k,v=line.split('=',1)
    if k.strip()=='ETHERFUSE_MVP_STELLAR_PUBLIC_KEY':
        print(v.strip())
        break
PY
)"
echo "$PUBKEY"
```

---

## 2) Enviar identidad (KYC)

```bash
cat > /tmp/kyc_identity.json <<EOF
{
  "publicKey": "$PUBKEY",
  "identity": {
    "email": "gerardo.gerry.pedrizco@gmail.com",
    "phoneNumber": "+525526621604",
    "occupation": "Founder",
    "name": {
      "givenName": "Gerardo",
      "familyName": "Pedrizco Vela"
    },
    "dateOfBirth": "1998-06-05",
    "address": {
      "street": "Tecoh 277",
      "city": "MEXICO",
      "region": "Tlalpan",
      "postalCode": "14100",
      "country": "MX"
    },
    "idNumbers": [
      { "type": "mx_curp", "value": "PEVG980605HDFDLR01" },
      { "type": "mx_rfc", "value": "PEVG980605UC6" }
    ]
  }
}
EOF

curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -H "Content-Type: application/json" \
  -X POST "$BASE_URL/api/seyf/kyc/submit" \
  --data-binary @/tmp/kyc_identity.json | python3 -m json.tool
```

---

## 3) Subir documentos (ID + selfie)

PNG 1x1 de prueba (base64):

```bash
export TINY_PNG_DATA_URL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z4XcAAAAASUVORK5CYII="
```

```bash
cat > /tmp/kyc_docs.json <<EOF
{
  "publicKey": "$PUBKEY",
  "document": {
    "idFront": { "label": "id_front", "image": "$TINY_PNG_DATA_URL" },
    "idBack": { "label": "id_back", "image": "$TINY_PNG_DATA_URL" }
  },
  "selfie": { "label": "selfie", "image": "$TINY_PNG_DATA_URL" }
}
EOF

curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -H "Content-Type: application/json" \
  -X POST "$BASE_URL/api/seyf/kyc/documents" \
  --data-binary @/tmp/kyc_docs.json | python3 -m json.tool
```

---

## 4) Registrar cuenta bancaria del customer (CLABE)

```bash
cat > /tmp/kyc_bank.json <<'EOF'
{
  "kind": "personal",
  "account": {
    "firstName": "Gerardo",
    "paternalLastName": "Pedrizco",
    "maternalLastName": "Vela",
    "birthDate": "19980605",
    "birthCountryIsoCode": "MX",
    "curp": "PEVG980605HDFDLR01",
    "rfc": "PEVG980605UC6",
    "clabe": "646180615200001646"
  }
}
EOF

curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -H "Content-Type: application/json" \
  -X POST "$BASE_URL/api/seyf/etherfuse/bank-account" \
  --data-binary @/tmp/kyc_bank.json | python3 -m json.tool
```

---

## 5) Aceptar agreements (en orden)

```bash
cat > /tmp/kyc_agreements.json <<'EOF'
{
  "customerInfo": {
    "email": "gerardo.gerry.pedrizco@gmail.com",
    "phone": "+525526621604",
    "occupation": "Founder",
    "additionalInfo": {
      "curp": "PEVG980605HDFDLR01",
      "rfc": "PEVG980605UC6"
    }
  }
}
EOF

curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -H "Content-Type: application/json" \
  -X POST "$BASE_URL/api/seyf/kyc/agreements" \
  --data-binary @/tmp/kyc_agreements.json | python3 -m json.tool
```

---

## 6) Verificar readiness final

```bash
curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  "$BASE_URL/api/seyf/etherfuse/readiness" | python3 -m json.tool
```

Esperado para habilitar onramp:

- `walletRegistered: true`
- `kycApproved: true`
- `documentsUploaded: true`
- `agreementsAccepted: true`
- `bankAccountReady: true`
- `trustlineReady: true`
- `onrampEnabled: true`

---

## Troubleshooting rápido

### Error: `already added user with this address`

La wallet ya está asociada a otro `customerId`. Solución:

- usar wallet nueva de Pollar, o
- limpiar sesión/cookie y reintentar con el customer correcto.

### Error: `Organization not found`

Casi siempre indica mezcla de contexto:

- `customerId` no pertenece a la API key actual, o
- cookie antigua con IDs de otro tenant/entorno.

Acción:

1. Reiniciar sesión (`Reiniciar prueba` en `/identidad`)
2. Confirmar `.env` (`ETHERFUSE_API_BASE_URL`, `ETHERFUSE_API_KEY`)
3. Repetir desde paso 2 con cookie jar limpio.

### `onrampEnabled=false` con reasons

Usar `reasons[]` del endpoint readiness como checklist exacto de bloqueo.

