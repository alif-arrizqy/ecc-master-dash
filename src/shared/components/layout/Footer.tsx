const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm py-4 mt-8">
      <div className="w-full px-2 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} ECC Master Dashboard - Sundaya Indonesia. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;

