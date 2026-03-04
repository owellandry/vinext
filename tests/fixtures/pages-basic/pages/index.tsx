import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <Head>
        <title>Hello openvite</title>
      </Head>
      <h1>Hello, openvite!</h1>
      <p>This is a Pages Router app running on Vite.</p>
      <Link href="/about">Go to About</Link>
    </div>
  );
}
