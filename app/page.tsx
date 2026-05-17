import Footer from "@/components/footer/Footer";
import Header from "@/components/header/Header";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center font-sans ">
      <Header visible={true} />
      <main className="
        flex
        flex-1
        flex-col
        w-full
        min-h-full
        max-w-6xl
        sm:items-start
      ">
        <p> contentsssss</p>
      </main>
      <Footer />
    </div>
  );
}
