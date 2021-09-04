import Head from 'next/head'

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>Stray Characters from @mamuso</title>
        <link rel="icon" type="image/png" href="/img/favicon.png"></link>
      </Head>
      <main>{children}</main>
    </>
  )
}
