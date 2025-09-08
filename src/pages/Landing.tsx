import { Helmet } from "react-helmet-async";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  CheckCircle, 
  Zap, 
  Shield, 
  Users, 
  Mail, 
  Phone, 
  MapPin,
  Star,
  TrendingUp,
  Clock,
  DollarSign
} from "lucide-react";
import { Link } from 'react-router-dom';

// Import screenshots
import dashboardScreenshot from "@/assets/dashboard-screenshot.jpg";
import invoicesScreenshot from "@/assets/invoices-screenshot.jpg";
import expensesScreenshot from "@/assets/expenses-screenshot.jpg";

const Landing = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return; // wait for auth to resolve
    if (user) {
      // If user is already signed in, redirect to dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);
  
  // While auth is being determined, don't render landing to avoid showing sidebar for authed users
  if (loading) return null;
  return (
    <AppShell>
      <Helmet>
        <title>QuickFlow — AI-Powered Accounting & Invoicing for Modern Businesses</title>
        <meta name="description" content="Transform your business finances with QuickFlow's AI-powered accounting platform. Create professional invoices, track expenses, and gain insights with our intuitive dashboard." />
        <meta name="keywords" content="accounting software, invoicing, expense tracking, small business, AI accounting, financial management" />
        <link rel="canonical" href="https://quickflow.app/" />
        <meta property="og:title" content="QuickFlow — AI-Powered Accounting & Invoicing" />
        <meta property="og:description" content="Transform your business finances with AI-powered accounting and invoicing." />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden bg-gradient-to-br from-background via-surface to-accent/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary))_0%,transparent_50%)] opacity-10"></div>
        <div className="container relative py-20 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-8 animate-fade-in">
              <Badge variant="outline" className="w-fit">
                <Star className="h-3 w-3 mr-1" />
                Trusted by 10,000+ businesses
              </Badge>
              <h1 className="text-4xl sm:text-6xl font-bold leading-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Accounting made
                <span className="text-primary"> intelligent</span>.
                Invoices that get
                <span className="text-primary"> paid</span>.
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                QuickFlow transforms your business finances with AI-powered insights, 
                automated workflows, and professional invoicing that gets results.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth/signup" className="w-full sm:w-auto">
                  <Button variant="hero" size="xl" className="group w-full sm:w-auto">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/pricing" className="w-full sm:w-auto">
                  <Button variant="outline" size="xl" className="w-full sm:w-auto">
                    View Pricing
                  </Button>
                </Link>
              </div>

              {/* Add a small visible login link on mobile */}
              <div className="mt-3 sm:mt-0">
                <Link to="/auth/login" className="block sm:hidden">
                  <Button variant="ghost" size="sm" className="w-full">Log in</Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">99%</div>
                  <div className="text-sm text-muted-foreground">Invoice Success</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">24hrs</div>
                  <div className="text-sm text-muted-foreground">Avg Payment</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">5min</div>
                  <div className="text-sm text-muted-foreground">Setup Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">AI Support</div>
                </div>
              </div>
            </div>
            <div className="relative animate-scale-in">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl"></div>
              <img 
                src={dashboardScreenshot} 
                alt="QuickFlow Dashboard Interface" 
                className="relative rounded-2xl shadow-2xl border max-w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="services" className="py-20 lg:py-32 bg-surface/30">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="w-fit mx-auto">
              <Zap className="h-3 w-3 mr-1" />
              Powerful Features
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold">
              Everything you need to manage your finances
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From AI-powered insights to professional invoicing, QuickFlow provides 
              all the tools modern businesses need to succeed.
            </p>
          </div>

          <div className="grid gap-12 lg:gap-20">
            {/* Invoice Management */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <Badge variant="secondary" className="w-fit">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Invoicing
                </Badge>
                <h3 className="text-3xl font-bold">
                  Professional invoices that get paid faster
                </h3>
                <p className="text-lg text-muted-foreground">
                  Create stunning, professional invoices in seconds. Our AI-powered 
                  templates and automated follow-ups help you get paid 3x faster.
                </p>
                <ul className="space-y-3">
                  {[
                    "Custom branded templates",
                    "Automated payment reminders", 
                    "Multiple payment options",
                    "Real-time payment tracking"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <img 
                  src={invoicesScreenshot} 
                  alt="Invoice Management Interface" 
                  className="rounded-xl shadow-2xl border"
                />
              </div>
            </div>

            {/* Expense Tracking */}
            <div className="grid lg:grid-cols-2 gap-8 items-center lg:grid-flow-col-dense">
              <div className="lg:col-start-2 space-y-6">
                <Badge variant="secondary" className="w-fit">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Analytics
                </Badge>
                <h3 className="text-3xl font-bold">
                  Smart expense tracking with AI insights
                </h3>
                <p className="text-lg text-muted-foreground">
                  Snap photos of receipts and our AI automatically categorizes 
                  and tracks your expenses. Get real-time insights into your spending.
                </p>
                <ul className="space-y-3">
                  {[
                    "AI receipt scanning",
                    "Automatic categorization",
                    "Real-time expense reports",
                    "Tax-ready documentation"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:col-start-1 relative">
                <img 
                  src={expensesScreenshot} 
                  alt="Expense Tracking Interface" 
                  className="rounded-xl shadow-2xl border"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose QuickFlow */}
      <section className="py-20 lg:py-32">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="w-fit mx-auto">
              <Shield className="h-3 w-3 mr-1" />
              Why QuickFlow
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold">
              Built for modern businesses
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="h-6 w-6" />,
                title: "Lightning Fast",
                description: "Set up your account in under 5 minutes and start invoicing immediately."
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Bank-Level Security",
                description: "Your financial data is protected with enterprise-grade encryption."
              },
              {
                icon: <Clock className="h-6 w-6" />,
                title: "Save 10 Hours/Week",
                description: "Automate repetitive tasks and focus on growing your business."
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: "Team Collaboration",
                description: "Work seamlessly with your team and accountant in one platform."
              },
              {
                icon: <TrendingUp className="h-6 w-6" />,
                title: "Smart Insights",
                description: "AI-powered analytics help you make better financial decisions."
              },
              {
                icon: <DollarSign className="h-6 w-6" />,
                title: "Increase Revenue",
                description: "Get paid faster with automated follow-ups and multiple payment options."
              }
            ].map((benefit, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Us */}
      <section id="about" className="py-20 lg:py-32 bg-surface/30">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="w-fit">
                <Users className="h-3 w-3 mr-1" />
                About QuickFlow
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold">
                Empowering businesses worldwide
              </h2>
              <p className="text-lg text-muted-foreground">
                Founded in 2023, QuickFlow was born from a simple mission: make financial 
                management accessible, intelligent, and delightful for every business.
              </p>
              <p className="text-lg text-muted-foreground">
                Our team of financial experts and AI engineers have created a platform 
                that doesn't just manage your finances—it helps you understand and 
                optimize them for growth.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-6">
                <div>
                  <div className="text-3xl font-bold text-primary">50K+</div>
                  <div className="text-muted-foreground">Happy Customers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">$2B+</div>
                  <div className="text-muted-foreground">Invoices Processed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">99.9%</div>
                  <div className="text-muted-foreground">Uptime</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">24/7</div>
                  <div className="text-muted-foreground">Support</div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <Card className="p-6">
                <CardContent className="p-0">
                  <h3 className="text-xl font-semibold mb-4">Our Mission</h3>
                  <p className="text-muted-foreground">
                    To democratize financial intelligence and make sophisticated 
                    accounting tools accessible to businesses of all sizes.
                  </p>
                </CardContent>
              </Card>
              <Card className="p-6">
                <CardContent className="p-0">
                  <h3 className="text-xl font-semibold mb-4">Our Vision</h3>
                  <p className="text-muted-foreground">
                    A world where every entrepreneur has the financial insights 
                    and tools they need to build successful, sustainable businesses.
                  </p>
                </CardContent>
              </Card>
              <Card className="p-6">
                <CardContent className="p-0">
                  <h3 className="text-xl font-semibold mb-4">Our Values</h3>
                  <p className="text-muted-foreground">
                    Transparency, innovation, and customer success drive everything 
                    we do. We believe in building trust through reliability and results.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us */}
      <section id="contact" className="py-20 lg:py-32">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="w-fit mx-auto">
              <Mail className="h-3 w-3 mr-1" />
              Get in Touch
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold">
              Ready to transform your finances?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Have questions? Our team is here to help you succeed. 
              Reach out and let's discuss how QuickFlow can grow your business.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="grid gap-6">
                <Card className="p-6">
                  <CardContent className="p-0 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Email Support</h3>
                      <p className="text-muted-foreground mb-2">
                        Get help from our expert support team
                      </p>
                      <p className="text-primary font-medium">support@quickflow.app</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-6">
                  <CardContent className="p-0 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Phone Support</h3>
                      <p className="text-muted-foreground mb-2">
                        Speak directly with our team
                      </p>
                      <p className="text-primary font-medium">+1 (555) 123-4567</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-6">
                  <CardContent className="p-0 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Office</h3>
                      <p className="text-muted-foreground mb-2">
                        Visit our headquarters
                      </p>
                      <p className="text-primary font-medium">
                        123 Business District<br />
                        San Francisco, CA 94105
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="p-8">
              <CardContent className="p-0 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Send us a message</h3>
                  <p className="text-muted-foreground">
                    Fill out the form below and we'll get back to you within 24 hours.
                  </p>
                </div>
                <form className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">First Name</label>
                      <input 
                        type="text" 
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Last Name</label>
                      <input 
                        type="text" 
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <input 
                      type="email" 
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="john@company.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Company</label>
                    <input 
                      type="text" 
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="Acme Inc"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <textarea 
                      rows={4}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="How can we help you?"
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <div className="container text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold">
            Ready to revolutionize your finances?
          </h2>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Join thousands of businesses who trust QuickFlow to manage their finances. 
            Start your free trial today—no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/signup">
              <Button variant="secondary" size="xl" className="group">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" size="xl" className="border-white/20 text-white hover:bg-white/10">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default Landing;