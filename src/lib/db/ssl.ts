import type { ConnectionOptions } from "node:tls";

/**
 * Supabase's own root certificate authority.
 *
 * Supabase does not use a publicly-trusted CA for Postgres: both the direct
 * connection (`db.<ref>.supabase.co`) and the poolers
 * (`*.pooler.supabase.com`) present a chain rooted here, which Node rejects
 * as `SELF_SIGNED_CERT_IN_CHAIN` against the system trust store. The usual
 * workaround is `sslmode=no-verify`, which keeps the traffic encrypted but
 * stops checking who is on the other end.
 *
 * Pinning the root instead keeps full verification — hostname included — so
 * an attacker who can redirect the connection still cannot read or alter it.
 *
 * The certificate is public (it is served on every handshake), self-signed,
 * and valid 2021-04-28 to 2031-04-26. Nothing here is a secret.
 */
const SUPABASE_ROOT_2021_CA = `-----BEGIN CERTIFICATE-----
MIIDxDCCAqygAwIBAgIUbLxMod62P2ktCiAkxnKJwtE9VPYwDQYJKoZIhvcNAQEL
BQAwazELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5l
dyBDYXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJh
c2UgUm9vdCAyMDIxIENBMB4XDTIxMDQyODEwNTY1M1oXDTMxMDQyNjEwNTY1M1ow
azELMAkGA1UEBhMCVVMxEDAOBgNVBAgMB0RlbHdhcmUxEzARBgNVBAcMCk5ldyBD
YXN0bGUxFTATBgNVBAoMDFN1cGFiYXNlIEluYzEeMBwGA1UEAwwVU3VwYWJhc2Ug
Um9vdCAyMDIxIENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqQXW
QyHOB+qR2GJobCq/CBmQ40G0oDmCC3mzVnn8sv4XNeWtE5XcEL0uVih7Jo4Dkx1Q
DmGHBH1zDfgs2qXiLb6xpw/CKQPypZW1JssOTMIfQppNQ87K75Ya0p25Y3ePS2t2
GtvHxNjUV6kjOZjEn2yWEcBdpOVCUYBVFBNMB4YBHkNRDa/+S4uywAoaTWnCJLUi
cvTlHmMw6xSQQn1UfRQHk50DMCEJ7Cy1RxrZJrkXXRP3LqQL2ijJ6F4yMfh+Gyb4
O4XajoVj/+R4GwywKYrrS8PrSNtwxr5StlQO8zIQUSMiq26wM8mgELFlS/32Uclt
NaQ1xBRizkzpZct9DwIDAQABo2AwXjALBgNVHQ8EBAMCAQYwHQYDVR0OBBYEFKjX
uXY32CztkhImng4yJNUtaUYsMB8GA1UdIwQYMBaAFKjXuXY32CztkhImng4yJNUt
aUYsMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAB8spzNn+4VU
tVxbdMaX+39Z50sc7uATmus16jmmHjhIHz+l/9GlJ5KqAMOx26mPZgfzG7oneL2b
VW+WgYUkTT3XEPFWnTp2RJwQao8/tYPXWEJDc0WVQHrpmnWOFKU/d3MqBgBm5y+6
jB81TU/RG2rVerPDWP+1MMcNNy0491CTL5XQZ7JfDJJ9CCmXSdtTl4uUQnSuv/Qx
Cea13BX2ZgJc7Au30vihLhub52De4P/4gonKsNHYdbWjg7OWKwNv/zitGDVDB9Y2
CMTyZKG3XEu5Ghl1LEnI3QmEKsqaCLv12BnVjbkSeZsMnevJPs1Ye6TjjJwdik5P
o/bKiIz+Fq8=
-----END CERTIFICATE-----
`;

/**
 * Connection settings for a `pg` pool, derived from the connection string.
 *
 * Spread into a `PoolConfig` in place of a bare `connectionString`.
 *
 * Supabase hosts get the pinned root above, and any `sslmode` parameter is
 * stripped from the URL first: `pg` lets a parsed `sslmode` *replace* an
 * explicit `ssl` option rather than merge with it, so leaving one in place
 * would silently discard the pinned CA — either failing the handshake
 * (`sslmode=require`, which `pg` currently treats as `verify-full` against
 * the system store) or dropping verification entirely (`sslmode=no-verify`).
 *
 * Every other host — docker-compose locally, any other provider — is passed
 * through untouched, so an `sslmode` in those URLs still means what it says.
 */
export function databaseConnection(connectionString: string): {
  connectionString: string;
  ssl?: ConnectionOptions;
} {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return { connectionString };
  }

  const host = url.hostname.toLowerCase();
  if (!host.endsWith(".supabase.co") && !host.endsWith(".supabase.com")) {
    return { connectionString };
  }

  url.searchParams.delete("sslmode");
  return {
    connectionString: url.toString(),
    ssl: { ca: SUPABASE_ROOT_2021_CA },
  };
}
