import { Button } from '@/components/ui/button';
import { Display, H2, H3, P, Lead, Muted } from '@/components/ui/typography';
import { Separator } from '@/components/ui/separator';

export function DocsPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-prose mx-auto px-6 py-10 space-y-10">
        <Button variant="outline" onClick={onBack} className="mb-4">
          ← Back to Home
        </Button>

        {/* What is SecondSens */}
        <section className="space-y-3">
          <Display>Learn How It Works</Display>
          <Lead>
            SecondSens helps you decide whether to buy a product brand new or secondhand,
            using AI-powered market analysis personalised to your preferences.
          </Lead>
        </section>

        <Separator />

        {/* Motivation */}
        <section className="space-y-3">
          <H2>Why We Built This</H2>
          <P>
            The secondhand market is fragmented. Prices vary wildly by condition, platform, and
            timing — and most people don't know if they're getting a fair deal, or if they should even buy second 
            hand to begin with. SecondSens removes
            that guesswork by combining real-time price data with your personal priorities to give
            you a clear, reasoned recommendation.
          </P>
        </section>

        <Separator />

        {/* How it works */}
        <section className="space-y-4">
          <H2>How It Works</H2>
          <ol className="space-y-3 list-decimal list-inside">
            <li><P className="inline">Search for a product by name — recently searched products appear at the top of suggestions.</P></li>
            <li><P className="inline">Optionally tap <strong>+ Compare two products</strong> to enter compare mode and pit two products head-to-head.</P></li>
            <li><P className="inline">Tune your preferences — budget sensitivity, quality expectations, urgency, and more. In compare mode, one set of preferences applies to both products.</P></li>
            <li><P className="inline">SecondSens analyses current market prices across all condition tiers.</P></li>
            <li><P className="inline">You receive a ranked recommendation with reasoning and a savings breakdown — or a side-by-side comparison with a verdict on which product is the better buy for your preferences.</P></li>
            <li><P className="inline">Sign in to save your searches and re-run any past recommendation in one tap.</P></li>
          </ol>
        </section>

        <Separator />

        {/* Tech stack */}
        <section className="space-y-3">
          <H2>Tech Stack</H2>
          <ul className="space-y-2 list-disc list-inside">
            <li><P className="inline"><strong>Frontend:</strong> React + TypeScript, modern component library</P></li>
            <li><P className="inline"><strong>Backend:</strong> Go API server</P></li>
            <li><P className="inline"><strong>AI:</strong> Google Gemini with live web search for real-time price data</P></li>
            <li><P className="inline"><strong>Marketplaces:</strong> Carousell SG, Facebook Marketplace SG, Lazada SG</P></li>
          </ul>
        </section>

        <Separator />

        {/* Preference sliders */}
        <section className="space-y-4">
          <H2>Your Preferences Explained</H2>
          <div className="space-y-4">
            <div>
              <H3>Budget Flexibility</H3>
              <P>How much does price matter to you? Low means you're watching every dollar; high means you're willing to pay more for the right item.</P>
            </div>
            <div>
              <H3>Quality Priority</H3>
              <P>How important is condition? Low means any working item is fine; high means you want it as close to pristine as possible.</P>
            </div>
            <div>
              <H3>Risk Tolerance</H3>
              <P>How comfortable are you with uncertainty? Low means you need guarantees and return policies; high means you're happy taking a chance on a private sale.</P>
            </div>
            <div>
              <H3>Use Frequency</H3>
              <P>How often will you actually use this? Occasional use suits secondhand; daily or heavy use may justify buying new.</P>
            </div>
            <div>
              <H3>Deal Urgency</H3>
              <P>Do you need it right now, or can you wait for the right listing to appear at the right price?</P>
            </div>
            <div>
              <H3>Resale Plans</H3>
              <P>Are you keeping it long-term, or planning to resell? Resale value influences whether buying new makes more financial sense.</P>
            </div>
          </div>
        </section>

        <Separator />

        {/* Condition tiers */}
        <section className="space-y-4">
          <H2>Condition Tiers Explained</H2>
          <div className="space-y-3">
            <div><H3>Brand New</H3><P>Sealed in original packaging, never used. Full manufacturer warranty.</P></div>
            <div><H3>Like New</H3><P>Opened or lightly used, no visible wear. May or may not include original packaging.</P></div>
            <div><H3>Good</H3><P>Normal signs of use — minor scratches or scuffs — but fully functional.</P></div>
            <div><H3>Well Used</H3><P>Visible wear consistent with regular use. Functional but may show cosmetic flaws.</P></div>
          </div>
        </section>

        <Separator />

        {/* FAQ */}
        <section className="space-y-4">
          <H2>FAQ</H2>
          <div className="space-y-4">
            <div>
              <H3>Is this free?</H3>
              <P>Yes. SecondSens is completely free to use.</P>
            </div>
            <div>
              <H3>How current are the prices?</H3>
              <P>
                Prices are sourced from live marketplace listings. Recommendations are cached for 24 hours
                — if a cached result is shown, you'll see a <strong>"Prices sourced Xd ago"</strong> banner
                with a <strong>Refresh</strong> button to fetch fresh data on demand.
              </P>
            </div>
            <div>
              <H3>What products are supported?</H3>
              <P>We cover a broad catalog of consumer electronics and accessories. If your product isn't in the catalog, SecondSens will attempt to validate and price it dynamically.</P>
            </div>
            <div>
              <H3>How is my recommendation calculated?</H3>
              <P>SecondSens weighs your six preference dimensions against current market price data across all condition tiers to produce a ranked recommendation with confidence scoring.</P>
            </div>
            <div>
              <H3>How does compare mode work under the hood?</H3>
              <P>
                When you compare two products, the backend runs both recommendation pipelines in parallel goroutines — so the wall-clock time is roughly the same as a single search, not double.
                Each product checks the shared cache independently; if either has been searched recently with the same preferences, that result is served instantly at no extra cost.
                Fresh comparisons use up to 4 Gemini calls total (2 per product), both running concurrently.
              </P>
            </div>
            <div>
              <H3>What is disambiguation?</H3>
              <P>
                If your search matches multiple distinct products (e.g. "iPad" could be any generation), SecondSens will ask you to pick exactly which one you mean before proceeding.
                In compare mode, each product is disambiguated independently — so one product may be unambiguous while the other triggers a selection step.
              </P>
            </div>
          </div>
        </section>

        <Separator />

        {/* Features */}
        <section className="space-y-4">
          <H2>Features</H2>
          <div className="space-y-4">
            <div>
              <H3>Compare Mode</H3>
              <P>
                Can't decide between two products? Tap <strong>+ Compare two products</strong> on the search page to enter compare mode.
                Enter both product names, set your preferences once, and SecondSens runs both pipelines in parallel —
                returning a side-by-side view with individual verdicts and a summary banner declaring which product is the better buy for your specific priorities.
                Compare mode requests allow up to 120 seconds since both pipelines run fresh data simultaneously;
                cached results return instantly just like single searches.
              </P>
            </div>
            <div>
              <H3>Gets Faster With Use</H3>
              <P>
                SecondSens maintains a shared price cache. Once a product has been searched by anyone,
                subsequent searches for the same product with the same preferences return instantly —
                no AI call needed. The app genuinely gets faster the more it is used.
                Results older than 24 hours are automatically refreshed to keep prices current.
                If you want live prices right now, hit the <strong>Refresh</strong> button on any cached result.
              </P>
            </div>
            <div>
              <H3>Search History</H3>
              <P>
                Sign in to keep a personal record of every recommendation you've run. Your history
                loads 10 entries at a time — tap <strong>Load more</strong> to page through older searches.
                Each card shows the top recommendation at a glance so you can spot patterns across your searches.
              </P>
            </div>
            <div>
              <H3>Extra Context</H3>
              <P>
                On the preferences screen, there's a free-text box where you can tell the AI anything
                relevant that the sliders can't capture — your shoe size, your PC's specs, how you plan
                to use the item, budget constraints in a specific currency, or anything else. The more
                context you give, the more tailored your recommendation will be.
              </P>
            </div>
            <div>
              <H3>Share a Result</H3>
              <P>
                Every recommendation page has a <strong>Share</strong> button that encodes your product and preferences into a URL.
                Anyone who opens the link will automatically get the same recommendation run for them —
                useful for sending a buying decision to a friend or saving a specific configuration.
              </P>
            </div>
            <div>
              <H3>Keyboard Shortcut</H3>
              <P>
                Press <strong>Ctrl+Shift+R</strong> at any time to do a clean reset back to the home page.
              </P>
            </div>
          </div>
        </section>

        <Separator />

        {/* Account */}
        <section className="space-y-4">
          <H2>Your Account</H2>
          <div className="space-y-4">
            <div>
              <H3>Sign In</H3>
              <P>
                SecondSens uses passwordless sign-in — enter your email and you'll receive a magic link.
                No password to remember or lose.
              </P>
            </div>
            <div>
              <H3>History</H3>
              <P>
                Every recommendation you run while signed in is automatically saved to your history.
                Open the history page from the navigation bar to browse past searches, see the top verdict at a glance,
                and re-run any search with one tap.
              </P>
            </div>
            <div>
              <H3>Profile</H3>
              <P>
                Your profile page shows your account details and lets you sign out.
                Your history is private — only you can see it.
              </P>
            </div>
          </div>
        </section>

        <Separator />

        {/* Limitations */}
        <section className="space-y-3">
          <H2>Limitations & Disclaimers</H2>
          <Muted>
            Prices shown are estimates based on live listings at the time of your query — they are not
            guaranteed and may change. Always verify prices before purchasing. AI analysis can make
            mistakes; use this as a guide, not a guarantee.
          </Muted>
        </section>

        <div className="pt-4">
          <Button variant="outline" onClick={onBack}>
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DocsPage;
