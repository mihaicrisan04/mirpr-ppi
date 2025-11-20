"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@mirpr-ppi/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ModeToggle } from "@/components/mode-toggle";
import { ThreadView } from "@/app/chat/thread-view";
import { MorphingPopover, MorphingPopoverContent, MorphingPopoverTrigger } from "@/components/motion-primitives/morphing-popover";
import { CreditCard, Home as HomeIcon, TrendingUp, Shield, Smartphone, Building2, ArrowRight, CheckCircle2, Users, Award, Globe, MessageCircle, Search, User, Settings, Languages, Download, Play, Linkedin, Facebook, Twitter, Youtube, Music, Podcast, ChevronUp, ShoppingCart, Instagram, X } from "lucide-react";

export default function Home() {
  const createThread = useMutation(api.agent.createAgentThread);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState(5000);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleCreateThread = async () => {
    if (!threadId) {
      const id = await createThread();
      setThreadId(id);
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    alert(`Mulțumim! Te-ai abonat cu emailul: ${newsletterEmail}`);
    setNewsletterEmail("");
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Show scroll to top button when scrolling down
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm dark:bg-black/95">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="relative h-10 w-10">
                  <Image
                    src="/images/bt-symbol-color.mix.svg"
                    alt="Bancă Transilvania Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-lg font-semibold text-foreground hidden sm:inline">Bancă Transilvania</span>
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/" className="text-sm font-medium text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Persoane Fizice
                </Link>
                <Link href="/dashboard" className="text-sm font-medium text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Persoane Juridice
                </Link>
                <Link href="/todos" className="text-sm font-medium text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Despre Noi
                </Link>
                <Link href="/chat" className="text-sm font-medium text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Contact
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="hidden lg:flex text-foreground hover:bg-accent">
                BT Pay
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700">
                Internet Banking
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                <User className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                <Languages className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                <ShoppingCart className="h-4 w-4" />
              </Button>
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Redesigned */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 py-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Main Hero Content */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <span className="text-white text-sm font-semibold">Banca ta digitală</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Soluții bancare pentru viața ta
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Conturi, carduri, credite și investiții - totul la un click distanță. 
                Banca care te înțelege și te susține în fiecare pas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 py-6 text-lg shadow-xl">
                  Deschide Cont
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm px-8 py-6 text-lg font-semibold">
                  Află Mai Mult
                </Button>
              </div>
            </div>
            
            {/* Hero Visual */}
            <div className="relative">
              <div className="relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                      <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-white font-semibold mb-2">Carduri Gratuite</h3>
                      <p className="text-blue-100 text-sm">Fără comisioane ascunse</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                      <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-white font-semibold mb-2">Investiții Simple</h3>
                      <p className="text-blue-100 text-sm">Pornire rapidă</p>
                    </div>
                  </div>
                  <div className="space-y-4 pt-8">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                      <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-white font-semibold mb-2">100% Sigur</h3>
                      <p className="text-blue-100 text-sm">Protecție avansată</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                      <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                        <Smartphone className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-white font-semibold mb-2">BT Pay</h3>
                      <p className="text-blue-100 text-sm">Plăți instant</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Promotional Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-purple-600 to-purple-800 border-0 overflow-hidden hover:scale-105 transition-transform cursor-pointer group">
              <div className="relative w-full h-48">
                <Image
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop"
                  alt="Insurance"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 to-transparent"></div>
                <div className="absolute top-4 left-4">
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">SAFED</span>
                </div>
              </div>
              <CardHeader className="p-5 bg-purple-700/50">
                <CardTitle className="text-white text-base leading-tight">Ai ofertă la toate asigurările: sănătate, viață, casă, viitor</CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-600 to-blue-700 border-0 overflow-hidden hover:scale-105 transition-transform cursor-pointer group">
              <div className="relative w-full h-48 bg-gradient-to-br from-cyan-500/30 to-blue-600/30 p-4">
                <div className="flex gap-3 justify-center items-center h-full">
                  <div className="relative w-28 h-40 rounded-xl overflow-hidden border-2 border-white/30 shadow-2xl transform group-hover:scale-110 transition-transform">
                    <Image
                      src="https://images.unsplash.com/photo-1551650975-87deedd944c3?w=200&h=300&fit=crop"
                      alt="Phone mockup 1"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="relative w-28 h-40 rounded-xl overflow-hidden border-2 border-white/30 shadow-2xl transform group-hover:scale-110 transition-transform -ml-6">
                    <Image
                      src="https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?w=200&h=300&fit=crop"
                      alt="Phone mockup 2"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
              <CardHeader className="p-5 bg-blue-700/50">
                <CardTitle className="text-white text-base leading-tight">Informații despre migrarea în BT Pay și BT Go</CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-green-600 to-emerald-700 border-0 overflow-hidden hover:scale-105 transition-transform cursor-pointer group">
              <div className="relative w-full h-48">
                <Image
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop"
                  alt="BT Pay app"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-green-900/90 to-transparent"></div>
              </div>
              <CardHeader className="p-5 bg-emerald-700/50">
                <CardTitle className="text-white text-base leading-tight mb-3">120.000 lei pentru planurile tale? Yes! Acum 100% online, direct din BT Pay</CardTitle>
                <Button className="w-full bg-white text-green-700 hover:bg-green-50 font-semibold">
                  Află mai mult
                </Button>
              </CardHeader>
            </Card>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <Button className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold py-6 border border-white/20 transition-all hover:scale-105">
              PROGRAMEAZĂ-TE ONLINE
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold py-6 border border-white/20 transition-all hover:scale-105">
              SIMULEAZĂ UN CREDIT
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold py-6 border border-white/20 transition-all hover:scale-105">
              HAI PE ÎNTREABĂ BT
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold py-6 border border-white/20 transition-all hover:scale-105">
              ÎNTREABĂ-MĂ DE 100 BANI
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* App Section 1 - My BT */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-5xl font-bold">DESCARCĂ MY</div>
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">Nou</span>
              </div>
              <div className="text-3xl font-semibold mb-6 text-foreground">TOTUL DIN APP, ÎN TIMP REAL</div>
              <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                Gestionează-ți conturile, plățile și investițiile direct din aplicația mobilă BT.
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-semibold dark:bg-blue-600 dark:hover:bg-blue-700">
                <Download className="mr-2 h-5 w-5" />
                Descarcă acum
              </Button>
            </div>
            <div className="flex justify-center">
              <div className="relative w-72 h-[600px] bg-gradient-to-b from-muted to-muted/80 rounded-[3rem] border-8 border-border p-2 shadow-2xl dark:from-gray-800 dark:to-gray-900 dark:border-gray-700">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-muted-foreground/30 rounded-full z-10 dark:bg-gray-600"></div>
                <div className="absolute inset-2 rounded-[2.5rem] overflow-hidden bg-background dark:bg-black">
                  <Image
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=600&fit=crop"
                    alt="BT My App"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Decision Section */}
      <section className="relative py-40 bg-gradient-to-r from-muted to-background overflow-hidden dark:from-gray-900 dark:to-black">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1920&h=800&fit=crop"
            alt="Decision background"
            fill
            className="object-cover opacity-20 dark:opacity-100"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80 dark:from-black/60 dark:via-black/40 dark:to-black/80"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h2 className="text-6xl md:text-7xl font-bold mb-12 text-foreground drop-shadow-2xl dark:text-white">TU DECIZI CE FACI CU BANII</h2>
            <div className="max-w-lg mx-auto bg-card/80 backdrop-blur-md rounded-2xl p-8 border border-border shadow-2xl dark:bg-white/10 dark:border-white/20">
              <div className="text-5xl font-bold mb-6 text-blue-600 dark:text-blue-400">
                {sliderValue.toLocaleString("ro-RO")} lei
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="1000"
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer dark:bg-gray-700/50 slider-input"
                  style={{
                    "--slider-progress": `${(sliderValue / 50000) * 100}%`
                  } as React.CSSProperties}
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-4 font-medium dark:text-gray-300">
                  <span>1.000</span>
                  <span>50.000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shopping/Cards Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-5xl font-bold">FII STAR LA SHOPPING</h2>
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">Nou</span>
              </div>
              <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                Beneficiază de cashback și reduceri exclusive cu cardurile Star de la BT. Plătește cu stil și economisește la fiecare cumpărătură.
              </p>
              <Button variant="outline" className="border-2 border-foreground text-foreground hover:bg-foreground hover:text-background px-8 py-6 text-lg font-semibold dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black">
                Află mai mult
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="flex gap-6 justify-center items-center">
              <div className="relative w-36 h-56 rounded-xl transform rotate-3 overflow-hidden shadow-2xl border-4 border-white/20 hover:scale-110 transition-transform">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-3xl transform -rotate-90 tracking-wider">STAR</span>
                  </div>
                  <div className="absolute bottom-6 right-4 text-white text-sm font-bold">VISA</div>
                  <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20"></div>
                </div>
              </div>
              <div className="relative w-36 h-56 rounded-xl transform -rotate-3 overflow-hidden shadow-2xl border-4 border-white/20 hover:scale-110 transition-transform z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-3xl transform -rotate-90 tracking-wider drop-shadow-lg">STAR</span>
                  </div>
                  <div className="absolute bottom-6 right-4 text-white text-sm font-bold">VISA</div>
                  <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20"></div>
                </div>
              </div>
              <div className="relative w-36 h-56 rounded-xl transform rotate-3 overflow-hidden shadow-2xl border-4 border-white/20 hover:scale-110 transition-transform">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-3xl transform -rotate-90 tracking-wider">STAR</span>
                  </div>
                  <div className="absolute bottom-6 right-4 text-white text-sm font-bold">VISA</div>
                  <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Savings Section */}
      <section className="relative py-40 bg-gradient-to-r from-muted to-background overflow-hidden dark:from-black dark:via-gray-900 dark:to-black">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1920&h=800&fit=crop"
            alt="Savings background"
            fill
            className="object-cover opacity-20 dark:opacity-100"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80 dark:from-black/60 dark:via-black/40 dark:to-black/80"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-12">
            <h2 className="text-6xl md:text-7xl font-bold text-foreground drop-shadow-2xl dark:text-white">ECONOMISEȘTI ÎN RITMUL TĂU</h2>
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">Nou</span>
          </div>
          <Button className="bg-foreground text-background hover:bg-foreground/90 px-8 py-6 text-lg font-semibold dark:bg-white dark:text-black dark:hover:bg-gray-200">
            Află mai mult
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* App Section 2 - BT Invest */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 flex justify-center">
              <div className="relative w-72 h-[600px] bg-gradient-to-b from-muted to-muted/80 rounded-[3rem] border-8 border-border p-2 shadow-2xl dark:from-gray-800 dark:to-gray-900 dark:border-gray-700">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-muted-foreground/30 rounded-full z-10 dark:bg-gray-600"></div>
                <div className="absolute inset-2 rounded-[2.5rem] overflow-hidden bg-background dark:bg-black">
                  <Image
                    src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&h=600&fit=crop"
                    alt="BT Invest App"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30"></div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="text-5xl font-bold mb-4">DESCARCĂ BT</div>
              <div className="text-3xl font-semibold mb-6 text-foreground">INVESTEȘTI MAI SIMPLU CA NICIODATĂ</div>
              <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                Accesează piața de capital, investește în acțiuni, obligațiuni și fonduri mutuale direct din aplicație.
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-semibold dark:bg-blue-600 dark:hover:bg-blue-700">
                <Download className="mr-2 h-5 w-5" />
                Descarcă acum
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <h2 className="text-5xl font-bold">BANCA OAMENILOR ÎN ROMÂNIA</h2>
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">Nou</span>
          </div>
          <h3 className="text-4xl font-semibold mb-8 text-blue-600 dark:text-blue-400">SUNTEM BANCA TRANSILVANIA</h3>
          <p className="text-muted-foreground max-w-3xl mx-auto mb-10 text-lg leading-relaxed">
            Suntem banca care pune oamenii pe primul loc. Oferim soluții bancare complete, accesibile și sigure pentru toți românii, indiferent de vârstă sau nevoi financiare.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-semibold dark:bg-blue-600 dark:hover:bg-blue-700">
            Află mai mult
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-foreground">TRENDING</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card border-border overflow-hidden hover:border-primary/50 transition-all cursor-pointer group">
              <div className="relative w-full h-56 overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop"
                  alt="Education program"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              </div>
              <CardHeader className="p-6">
                <CardTitle className="text-card-foreground text-base mb-2 leading-tight">Oligatorii Burselor BT Roberto Marzoni și Transilvania Executive Education MSA</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  Programe educaționale pentru viitorul tău profesional
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-card border-border overflow-hidden hover:border-primary/50 transition-all cursor-pointer group">
              <div className="relative w-full h-56 overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop"
                  alt="Building facade"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent dark:from-black/80"></div>
              </div>
              <CardHeader className="p-6">
                <CardTitle className="text-card-foreground text-base mb-2 leading-tight">Banca Transilvania și BT Investments</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  Aprobare pentru achiziție strategică
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-card border-border overflow-hidden hover:border-primary/50 transition-all cursor-pointer group">
              <div className="relative w-full h-56 overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=300&fit=crop"
                  alt="Charity hands"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              </div>
              <CardHeader className="p-6">
                <CardTitle className="text-card-foreground text-base mb-2 leading-tight">Mastercard și Banca Transilvania</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  Program de colaborare cu Salvați Copiii România
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Security & Info Sections */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-2xl font-bold text-foreground">SIGURANȚA ONLINE</h3>
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">Nou</span>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Protejăm datele tale cu tehnologie avansată de criptare și autentificare în doi pași. Toate tranzacțiile sunt monitorizate 24/7 pentru siguranța ta.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">FIT</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Programul nostru de educație financiară pentru tineri. Învață să gestionezi banii inteligent și să construiești un viitor financiar solid.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12 dark:bg-black">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
              <div className="relative h-10 w-10">
                <Image
                  src="/images/bt-symbol-color.mix.svg"
                  alt="Bancă Transilvania Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-lg font-semibold text-foreground">Bancă Transilvania</span>
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                <Linkedin className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                <Youtube className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                <Music className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                <Podcast className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-5 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Companie</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Despre Noi</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Cariere</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Știri</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Sustenabilitate</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Utile</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Calculator</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Cursuri Valutare</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">ATM-uri</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Sucursale</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Relația cu BT</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Internet Banking</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">BT Pay</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">BT Go</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">BT Invest</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Termeni și Condiții</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Politica de Confidențialitate</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Cookies</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">GDPR</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Asistență Clienți</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Tel: 0800 800 800</li>
                <li>Email: contact@bancatransilvania.ro</li>
                <li className="mt-4">
                  <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      required
                      className="flex-1 px-3 py-2 bg-input border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700">
                      Abonează-te
                    </Button>
                  </form>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8">
            <p className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} Banca Transilvania. Toate drepturile rezervate.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Button
            onClick={scrollToTop}
            className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
            size="icon"
            type="button"
            aria-label="Scroll to top"
          >
            <ChevronUp className="h-6 w-6" />
          </Button>
        )}
        
        {/* Chat Button with Morphing Popover */}
        <MorphingPopover>
          <MorphingPopoverTrigger asChild>
            <Button
              className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
              size="icon"
              type="button"
            >
              <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span className="sr-only">Open chat</span>
            </Button>
          </MorphingPopoverTrigger>
          <MorphingPopoverContent className="bottom-20 right-0 max-w-2xl w-[min(90vw,32rem)] max-h-[80vh] flex flex-col p-0 bg-background border border-border shadow-xl">
            <div className="px-6 pt-6 pb-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Chat Assistant</h2>
            </div>
            <div className="flex-1 overflow-y-auto min-h-[400px] px-6 py-4">
              {threadId ? (
                <ThreadView threadId={threadId} />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 h-full min-h-[400px]">
                  <MessageCircle className="h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">Start a new conversation</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Click the button below to create a new chat thread and start chatting with our AI assistant
                  </p>
                  <Button
                    onClick={handleCreateThread}
                    className="bg-blue-600 hover:bg-blue-700 text-white mt-2 dark:bg-blue-600 dark:hover:bg-blue-700"
                    type="button"
                  >
                    Create Thread
                  </Button>
                </div>
              )}
            </div>
          </MorphingPopoverContent>
        </MorphingPopover>
      </div>
    </div>
  );
}
