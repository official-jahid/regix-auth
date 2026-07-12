import Link from "next/link";
import ThemeToggleButton from "../Buttons/ThemeToggleButton";
import AuthNav from "./AuthNav";

const Header = () => {
  return (
    <header
      className="fixed top-3 right-70 left-70 z-50 rounded-full border-4 shadow-2xl backdrop-blur-sm"
      aria-label="app-header">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href={"/"}>
          <h1
            className="text-2xl font-semibold"
            aria-label="App Name">
            Auth App
          </h1>
        </Link>

        <nav className="flex items-center gap-4">
          <AuthNav />

          <ThemeToggleButton />
        </nav>
      </div>
    </header>
  );
};

export default Header;
