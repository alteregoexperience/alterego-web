import LoginClient from "./LoginClient";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;

  const redirect = params.redirect || "/gestion/participantes";

  return <LoginClient redirect={redirect} />;
}
