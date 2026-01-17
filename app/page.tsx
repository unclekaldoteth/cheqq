import {
  Navbar,
  Hero,
  Products,
  HowItWorks,
  Advantages,
  Partners,
  CTA,
  Footer,
} from '@/components/landing';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Products />
        <HowItWorks />
        <Advantages />
        <Partners />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
