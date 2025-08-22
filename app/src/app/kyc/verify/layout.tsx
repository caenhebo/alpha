export default function KycVerifyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        src="https://static.sumsub.com/idensic/static/sns-websdk-builder.js"
        async
      />
      {children}
    </>
  )
}