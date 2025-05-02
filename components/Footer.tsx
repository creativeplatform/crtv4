import Link from "next/link";
import Image from "next/image";
import { SITE_LOGO } from "@/context/context";

export default function Component() {
  // Get current Year
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#F7F7F7] py-2.5 border-t">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center" prefetch={false}>
            <Image
              src={SITE_LOGO}
              alt="Creative Logo"
              style={{
                width: "20px",
                height: "auto",
              }}
              width={20}
              height={20}
              className="object-contain"
            />
            <span
              className="text-sm font-medium ml-2"
              style={{ fontFamily: "ConthraxSb-Regular , sans-serif" }}
            >
              CREATIVE
            </span>
          </Link>

          <div className="flex items-center">
            <Link
              href="https://app.creativeplatform.xyz"
              className="flex items-center text-[13px] text-gray-600 hover:text-red-600 transition-colors duration-300 ease-in-out mr-4 group"
              prefetch={false}
            >
              <PowerIcon className="h-[18px] w-[18px] mr-1 group-hover:stroke-red-600 transition-colors duration-300 ease-in-out" />
              Exit dApp
            </Link>

            <p className="text-xs text-gray-500">
              © {currentYear} Creative Organization DAO. All rights reserved.
            </p>
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
