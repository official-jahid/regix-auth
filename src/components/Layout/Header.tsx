import Link from "next/link";
import ThemeToggleButton from "./ThemeToggleButton";
import UserMenu from "./UserMenu";

const Header = ({ minimal = false }: { minimal?: boolean }) => {
  return (
    <header
      className="bg-background fixed top-0 right-0 left-0 z-50 border-b shadow"
      aria-label="app-header">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Link
          href={"/"}
          className="shrink-0">
          <h1
            className="text-xl font-semibold sm:text-2xl"
            aria-label="App Name">
            REGIX Studio
          </h1>
        </Link>

        {!minimal && (
          <nav
            className="hidden items-center gap-4 md:flex"
            aria-label="primary">
            <Link href={"/"}>Home</Link>
            <Link href={"/posts"}>Posts</Link>
            <Link href={"/categories"}>Categories</Link>
            <Link href={"/tags"}>Tags</Link>
          </nav>
        )}

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <UserMenu hideRegister={minimal} />

          <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
};

export default Header;
