import "./globals.css";

export const metadata = {
  title: "Libersa Stock",
  description: "Gestion de stock Libersa",
  applicationName: "Libersa Stock",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}