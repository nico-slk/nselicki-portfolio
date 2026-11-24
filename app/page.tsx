import PortfolioView from "@/components/portfolio/PortfolioView";
import { getMockPortfolioContent } from "@/lib/firebase/content";

/**
 * Home pública estática (exportable a Firebase Hosting).
 * Arranca con el contenido inicial y en el cliente se sincroniza con Firestore.
 */
export default function Home() {
  return <PortfolioView initialContent={getMockPortfolioContent()} />;
}
