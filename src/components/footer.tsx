import React from "react";

const FooterComponent = () => {
  return (
    <footer className="py-6 bg-gray-300">
      <div className="container mx-auto px-4">
        <div className="flex">
          <div className="text-sm">
            Built by{" "}
            <a
              href="www.general-purpose.io"
              target="_blank"
              className="text-blue-600 dark:text-blue-500 hover:underline pr-2"
            >
              General Purpose. 
            </a>
            Powered by{" "}
            <a
              href="https://github.com/visheratin/web-ai"
              target="_blank"
              className="text-blue-600 dark:text-blue-500 hover:underline"
            >
              WebAI
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default FooterComponent;
