import { Button } from "../../ui/button";
import {
  Navbar as NavbarComponent,
  NavbarLeft,
  NavbarRight,
} from "../../ui/navbar";
import { Sheet, SheetContent, SheetTrigger } from "../../ui/sheet";
import { Menu } from "lucide-react";
import LaunchUI from "../../logos/launch-ui";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 -mb-4 px-4 pb-4">
      <div className="fade-bottom bg-background/15 absolute left-0 h-24 w-full backdrop-blur-lg"></div>
      <div className="max-w-container relative mx-auto">
        <NavbarComponent>
          <NavbarLeft>
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold"
            >
              <LaunchUI />
              Launch UI
            </Link>
          </NavbarLeft>
          <NavbarRight>
            <Link href="/" className="hidden text-sm md:block">
              Sign in
            </Link>
            <Button variant="default" asChild>
              <Link href="/">Get Started</Link>
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <Menu className="size-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="grid gap-6 text-lg font-medium">
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-xl font-bold"
                  >
                    <span>Launch UI</span>
                  </Link>
                  <Link
                    href="/"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Getting Started
                  </Link>
                  <Link
                    href="/"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Components
                  </Link>
                  <Link
                    href="/"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Documentation
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </NavbarRight>
        </NavbarComponent>
      </div>
    </header>
  );
}
