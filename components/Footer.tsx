import Link from "next/link";
import Image from "next/image";
import { SITE_LOGO } from "@/context/context";

export default function Component() {
  // Get current Year
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-[#F7F7F7] dark:bg-gray-950 dark:border-gray-800 py-4 md:py-2.5">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
          {/* Logo */}
          <Link href="/" className="flex items-center" prefetch={false}>
            <Image
              src={SITE_LOGO}
              alt="Creative Logo"
              width={20}
              height={20}
              className="object-contain w-5 h-5"
            />
            <h1
              className="text-md ml-2 dark:text-white text-gray-900"
              style={{ fontFamily: "ConthraxSb-Regular , sans-serif" }}
            >
              CREATIVE
            </h1>
          </Link>

          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
            <Link
              href="https://app.creativeplatform.xyz"
              className="flex items-center text-[13px] text-gray-600 dark:text-gray-300 \
                hover:text-red-600 dark:hover:text-red-400 focus-visible:text-red-600 dark:focus-visible:text-red-400 \
                transition-colors duration-300 ease-in-out group"
              prefetch={false}
            >
              <PowerIcon
                className="h-[18px] w-[18px] mr-1 group-hover:stroke-red-600 \
                  dark:group-hover:stroke-red-400 transition-colors duration-300 ease-in-out"
              />
              Exit dApp
            </Link>

            <Link
              href="https://creativeplatform.xyz"
              prefetch={false}
              className="text-xs text-gray-500 dark:text-gray-400 text-center md:text-left \
                hover:text-red-600 dark:hover:text-red-400 focus-visible:text-red-600 dark:focus-visible:text-red-400 \
                transition-colors duration-300 ease-in-out"
            >
              © {currentYear} Creative Organization DAO. All rights reserved.
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function MountainIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
}

function PowerIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v9M5.63 5.64a9 9 0 1 0 12.74 0" />
    </svg>
  );
}

function XIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
