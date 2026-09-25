/* =====================================================================
   FRESH VALLEY — Theme (Online Store 2.0-style)
   Every marketing page is a list of sections; every section has settings
   and optional blocks — the same model Shopify's theme editor uses.
   The admin edits a copy of this JSON; the storefront resolves:

     preview draft (theme editor iframe)
       > newest of { published content.js , this browser's saved theme }
       > the defaults below

   Inline markup allowed in text settings:
     *word*  → olive italic accent      ~word~ → hand-drawn underline
     line breaks → <br>
   Image references: product slug ("mango"), "banner:packaging",
   "hero", "art:herbs", or any URL / uploaded file.
   ===================================================================== */
window.FVTheme = (function () {
  "use strict";

  const DEFAULTS = {
    version: 4,
    updatedAt: 0,
    settings: {
      store_name: "Fresh Valley",
      tagline: "Export-grade produce · Cairo",
      announcement: { enabled: true, text: "Order before 6pm for next-day delivery across Cairo · complimentary over EGP 600", link: "products.html", link_label: "Shop now" },
      nav: [
        { label: "Shop", href: "products.html" },
        { label: "Boxes", href: "products.html?cat=boxes" },
        { label: "The Art of Hosting", href: "hosting.html" },
        { label: "Journal", href: "journal.html" },
        { label: "About", href: "about.html" },
      ],
      footer: {
        title: "Eat with the season.\n*Host a little better.*",
        newsletter_text: "A quiet note each month — what is at its peak, a recipe worth keeping, and an idea for your next table. No noise.",
        blurb: "Export-grade produce, curated for modern hosting and a quieter kind of luxury. Grown well, graded by hand, delivered with care.",
        columns: [
          { title: "Shop", links: [
            { label: "All produce", href: "products.html" },
            { label: "Boxes", href: "products.html?cat=boxes" },
            { label: "Seasonal", href: "products.html?cat=seasonal" },
            { label: "Organic Reserve", href: "products.html?cat=organic-reserve" },
            { label: "Best sellers", href: "products.html?collection=best-sellers" } ] },
          { title: "The brand", links: [
            { label: "About us", href: "about.html" },
            { label: "The Art of Hosting", href: "hosting.html" },
            { label: "Journal", href: "journal.html" },
            { label: "Behind the quality", href: "about.html#quality" } ] },
          { title: "Care", links: [
            { label: "Contact", href: "contact.html" },
            { label: "Delivery areas", href: "contact.html#areas" },
            { label: "Company policies", href: "policies.html" },
            { label: "Terms of use", href: "terms.html" } ] },
          { title: "Account", links: [
            { label: "My account", href: "account.html" },
            { label: "Orders", href: "account.html#orders" },
            { label: "Wishlist", href: "wishlist.html" },
            { label: "Reorder", href: "account.html#reorder" } ] },
        ],
      },
      social: { instagram: "https://instagram.com/freshvalley.eg", facebook: "https://facebook.com/freshvalley.eg", tiktok: "https://tiktok.com/@freshvalley.eg" },
      contact: { phone: "+20 100 000 0000", whatsapp: "201000000000", email: "hello@freshvalley.eg", hours: "Sat – Thu, 9am – 9pm · Fri, 1pm – 9pm", city: "Cairo, Egypt" },
      areas: ["New Cairo", "Sheikh Zayed", "October", "Madinaty", "Rehab"],
      colors: {},
    },

    pages: {
      /* ============================ HOME ============================ */
      index: { title: "Home", sections: [
        { id: "hero", type: "hero", settings: {
          badge: "In season now — winter strawberries", badge_link: "products.html?cat=seasonal",
          line1: "Fresh from", line2: "the ~valley~,", line3: "to your", words: "table|kitchen|door|family",
          lede: "Hand-graded fruit, vegetables and curated boxes — the quality you'd only find abroad, at your door tomorrow.",
          cta1_label: "Shop the market", cta1_link: "products.html",
          cta2_label: "Build a hosting box", cta2_link: "products.html?cat=boxes",
          proof: "*4.9* from 1,400+ verified orders across Cairo",
          image: "hero", image_alt: "A host arranging export-grade fruit on a marble table",
          orbs: "strawberry,mango,red-grapes,medjool-dates",
          sticker: "Export-grade • Hand-graded • Next-day •",
          chips: "Export-grade|Cold-chain kept|Next-day in Cairo",
          rating: "4.9", rating_label: "1,400+ orders",
        } },
        { id: "marquee", type: "marquee", settings: { items: "Export-grade|Hand-graded|Cooled within hours|Wrapped in kraft|Next-day across Cairo|Grown in Egypt", style: "cross", speed: 1 } },
        { id: "categories", type: "categories", settings: { eyebrow: "The market", title: "Shop by *category*", text: "Six ways into the season — every piece graded by hand and chosen for the table.", cta_label: "View everything", cta_link: "products.html" }, blocks: [
          { type: "tile", settings: { title: "Fruits", text: "Sun-ripened, graded by hand", image: "strawberry", link: "products.html?cat=fruits", count: "fruits" } },
          { type: "tile", settings: { title: "Vegetables", text: "Crisp, clean, picked at peak", image: "pepper-medley", link: "products.html?cat=vegetables", count: "vegetables" } },
          { type: "tile", settings: { title: "Hosting boxes", text: "Curated, wrapped, ready to gift", image: "banner:door-delivery", link: "products.html?cat=boxes", count: "boxes" } },
          { type: "tile", settings: { title: "Seasonal", text: "What is best, right now", image: "mango", link: "products.html?cat=seasonal", count: "seasonal" } },
          { type: "tile", settings: { title: "Organic reserve", text: "Our quietest, rarest selections", image: "medjool-dates", link: "products.html?cat=organic-reserve", count: "organic-reserve" } },
          { type: "tile", settings: { title: "Herbs", text: "Cut fresh for the table", image: "art:herbs", link: "products.html?cat=herbs", count: "herbs" } },
        ] },
        { id: "best", type: "product_rail", settings: { eyebrow: "Loved by our tables", title: "Best *sellers*", text: "", collection: "best-sellers", limit: 12, cta_label: "View all", cta_link: "products.html?collection=best-sellers", band: "paper" } },
        { id: "story", type: "story", settings: {
          eyebrow: "Our signature · only from Fresh Valley", title: "Arrive with the *season*.",
          text: "No one visits empty-handed. We make what you carry unforgettable — a hand-graded box of produce, wrapped like a gift, set on the table the moment you walk in.",
          struck: "A box of chocolates|A bottle of cola|The usual sweets",
          cta_label: "Gift a hosting box", cta_link: "product.html?box=hosting-box", cta2_label: "The full story", cta2_link: "hosting.html" }, blocks: [
          { type: "step", settings: { title: "Choose your box", text: "Fruit, vegetables, or both — sized for four guests or sixteen.", image: "pepper-medley" } },
          { type: "step", settings: { title: "We grade, arrange & wrap", text: "Every piece graded by hand, composed like a still life and wrapped in our own paper.", image: "banner:packaging" } },
          { type: "step", settings: { title: "You arrive generous", text: "Delivered next-day, cold and ready to set down. They remember it.", image: "banner:door-delivery" } },
        ] },
        { id: "boxes", type: "boxes", settings: { eyebrow: "Our flagship", title: "Fresh Valley *boxes*", text: "Composed like a still life, graded to export standard, wrapped to arrive looking like the gift it is.", boxes: "hosting-box,premium-fruit-box,family-box,organic-reserve-box", cta_label: "All boxes", cta_link: "products.html?cat=boxes", band: "kraft" } },
        { id: "stats", type: "stats", settings: { eyebrow: "Why Fresh Valley", title: "Graded like an export house.\n*Delivered like a guest.*", band: "dark" }, blocks: [
          { type: "stat", settings: { value: "4.9", decimals: 1, suffix: "", label: "Average rating from verified orders" } },
          { type: "stat", settings: { value: "1400", decimals: 0, suffix: "+", label: "Verified orders delivered across Cairo" } },
          { type: "stat", settings: { value: "5", decimals: 0, suffix: "", label: "Premium districts, served next-day" } },
          { type: "stat", settings: { value: "100", decimals: 0, suffix: "%", label: "Export-grade selection, every piece" } },
        ] },
        { id: "quality", type: "image_text", settings: {
          eyebrow: "Behind the quality", title: "Nothing reaches your table by *accident*.",
          text: "Every piece passes the same four checks the export market demands. What reaches you has earned its place.",
          list: "Selection — only lots that meet export specification|Grading — sorted by hand for size, colour, firmness and ripeness|Cold chain — cooled within hours of harvest, kept cold to your door|Presentation — wrapped to arrive looking like a gift",
          image: "banner:packaging", chip: "Our pressed-leaf paper", cta_label: "How we grade", cta_link: "about.html#quality", flip: false, band: "paper" } },
        { id: "season", type: "product_rail", settings: { eyebrow: "At its peak", title: "In season *now*", text: "A changing selection, only while it is truly at its best.", collection: "seasonal", limit: 10, cta_label: "Shop seasonal", cta_link: "products.html?cat=seasonal", band: "sage" } },
        { id: "reviews", type: "testimonials", settings: { eyebrow: "From our hosts", title: "Loved across *Cairo*", rating: "4.9", rating_label: "1,400+ verified orders", limit: 18, tags: "" } },
        { id: "delivery", type: "banner", settings: { eyebrow: "Next-day across five districts", title: "Set a better table, *tomorrow*.", text: "New Cairo · Sheikh Zayed · October · Madinaty · Rehab. Order before 6pm and it arrives cold, graded and ready.", image: "banner:home-delivery", cta_label: "Start your basket", cta_link: "products.html", cta2_label: "Delivery areas", cta2_link: "contact.html#areas" } },
        { id: "journal", type: "journal", settings: { eyebrow: "The Journal", title: "Notes on eating *well*", limit: 3, layout: "grid", cta_label: "All entries", cta_link: "journal.html" } },
      ] },

      /* ======================= THE ART OF HOSTING ======================= */
      hosting: { title: "The Art of Hosting", sections: [
        { id: "head", type: "page_head", settings: { eyebrow: "The Art of Hosting", title: "Arrive with something they'll *remember*.", text: "In Egypt, no one visits empty-handed. We turn that small, beautiful habit into something unforgettable — a box of the season, graded and wrapped by hand, set on the table the moment you walk in.", cta_label: "Gift a hosting box", cta_link: "product.html?box=hosting-box", cta2_label: "See the ritual", cta2_link: "#ritual", image: "banner:home-delivery", caption: "The arrival.", art: "sprig" } },
        { id: "forgettable", type: "strike_list", settings: { eyebrow: "The problem", title: "We've all brought the *forgettable* gift.", text: "We reach for them because they're easy — not because they're meant. A real gift should say *I thought about you*. Most just say *I stopped on the way*.", items: "Chocolates — melt by the door|Flowers — wilt by morning|A bottle of cola — no one opens|The usual sweets — everyone forgets", band: "paper" } },
        { id: "philosophy", type: "seasons", settings: { eyebrow: "Our philosophy", title: "Bring the season. Bring something *alive*.", text: "Fruit at its peak is honest — it can't be faked or rushed. When you bring the season, you bring something that was perfect for exactly this moment. That isn't a gift you grabbed. It's a gift you timed.", band: "kraft" }, blocks: [
          { type: "season", settings: { image: "strawberry", label: "Winter", title: "Strawberries", text: "Deep red, fragrant, gone by March." } },
          { type: "season", settings: { image: "green-grapes", label: "Spring", title: "Grapes, two ways", text: "Bright, clean and elegantly tart." } },
          { type: "season", settings: { image: "mango", label: "Summer", title: "Egyptian mango", text: "Ismailia's few golden weeks." } },
          { type: "season", settings: { image: "medjool-dates", label: "Autumn", title: "Siwa dates", text: "Soft, glossy, endlessly generous." } },
        ] },
        { id: "ritual", type: "hscroll", settings: { eyebrow: "The ritual", title: "From our hands to *their table*.", text: "Six quiet steps between the orchard and the moment you walk in.", band: "dark" }, blocks: [
          { type: "card", settings: { title: "You choose", text: "Fruit, vegetables, or both.", image: "apple-medley" } },
          { type: "card", settings: { title: "We select", text: "Only export-grade, by hand.", image: "red-grapes" } },
          { type: "card", settings: { title: "We arrange", text: "Composed like a still life.", image: "pepper-medley" } },
          { type: "card", settings: { title: "We wrap", text: "Paper, ribbon, a written card.", image: "banner:packaging" } },
          { type: "card", settings: { title: "It arrives", text: "Cold, fresh, ready to place.", image: "banner:door-delivery" } },
          { type: "card", settings: { title: "They remember", text: "Long after the evening ends.", image: "hero" } },
        ] },
        { id: "moments", type: "gallery", settings: { eyebrow: "For every table", title: "A box for every kind of *moment*.", text: "", cta_label: "Shop boxes", cta_link: "products.html?cat=boxes", band: "paper" }, blocks: [
          { type: "moment", settings: { image: "pepper-medley", title: "The Friday lunch", text: "When the whole family gathers.", link: "products.html?cat=boxes" } },
          { type: "moment", settings: { image: "medjool-dates", title: "The unexpected guest", text: "Always be ready.", link: "products.html?cat=boxes" } },
          { type: "moment", settings: { image: "orange", title: "The new neighbour", text: "A warm first hello.", link: "products.html?cat=boxes" } },
          { type: "moment", settings: { image: "strawberry", title: "The celebration", text: "Sweeter, shared.", link: "products.html?cat=boxes" } },
          { type: "moment", settings: { image: "red-grapes", title: "The thank-you", text: "For the host who had you over.", link: "products.html?cat=boxes" } },
          { type: "moment", settings: { image: "apple-medley", title: "The quiet apology", text: "Some words are easier in a box.", link: "products.html?cat=boxes" } },
        ] },
        { id: "collection", type: "boxes", settings: { eyebrow: "The collection", title: "Five ways to be *remembered*.", text: "Each box is composed like a still life, graded to export standard, and wrapped to arrive looking like the gift it is.", boxes: "hosting-box,premium-fruit-box,family-box,seasonal-box,organic-reserve-box", cta_label: "", cta_link: "", band: "kraft" } },
        { id: "difference", type: "compare", settings: { eyebrow: "The difference", title: "Why a box, and not a *bouquet*.", old_title: "The usual gift", old_items: "Looks nice for an evening, then it's gone.|The same thing everyone brings.|Decorative — admired, rarely used.|Could have been bought any day.", new_title: "A Fresh Valley box", new_items: "It gets eaten, shared, enjoyed — not just admired.|It's seasonal. It could only have come now.|It's generous — enough for the whole table.|Graded, arranged and wrapped by hand.|The gesture outlives the evening.", band: "paper" } },
        { id: "details", type: "image_text", settings: { eyebrow: "The details", title: "It's the small things they *notice*.", text: "", list: "Branded paper — wrapped in our own pressed-leaf paper, never a plastic bag|The seasonal ribbon — tied in Mid Forest or Charcoal, a small signal of the season|A handwritten card — your words, written by hand, not a printed sticker|Composed, not packed — arranged like a still life, beautiful the moment it opens", image: "banner:packaging", chip: "Mid Forest · Charcoal", cta_label: "", cta_link: "", flip: true, band: "paper" } },
        { id: "proof", type: "testimonials", settings: { eyebrow: "From our hosts", title: "The gift they *remembered*.", rating: "4.9", rating_label: "Real words, from real tables", limit: 12, tags: "Hosting Box,The Art of Hosting,Premium Fruit Box,Organic Reserve,Family Box,The details" } },
        { id: "belief", type: "quote", settings: { quote: "Generosity is the oldest language we have. We simply gave it a *box*.", cite: "The Fresh Valley belief", image: "banner:delivery-van" } },
        { id: "begin", type: "cta", settings: { eyebrow: "Begin", title: "Be the guest they *remember*.", text: "Choose a box, add a few words, and we'll do the rest — graded, arranged, wrapped and delivered ready for the table.", cta_label: "Gift a hosting box", cta_link: "product.html?box=hosting-box", cta2_label: "See all boxes", cta2_link: "products.html?cat=boxes", style: "olive", art: "bouquet", newsletter: false } },
      ] },

      /* ============================ ABOUT ============================ */
      about: { title: "About", sections: [
        { id: "head", type: "page_head", settings: { eyebrow: "Our story", title: "Produce, treated with the care it *deserves*.", text: "Fresh Valley is a premium produce company. We work directly with Egypt's finest growers — the same farms that supply Europe's best tables — to select export-grade fruit and vegetables for homes here.", cta_label: "Browse the collection", cta_link: "products.html", cta2_label: "", cta2_link: "", image: "banner:staff-shirt", caption: "Graded by hand in Cairo.", art: "leaf" } },
        { id: "story", type: "image_text", settings: { eyebrow: "Where it began", title: "We wanted to keep some of the best *here*.", text: "We started Fresh Valley with a simple frustration: the best of Egypt's produce was leaving the country, while the rest filled the shelves at home.\n\nSo we go a step further. We curate that produce into boxes and collections built for the way people host today: generously, beautifully, and without a fuss. It is an everyday purchase, raised to the standard of an occasion.\n\nWe are based in Cairo, and we deliver to the neighbourhoods we know best — carefully, on time, and in packaging worth keeping.", list: "", image: "banner:delivery-van", chip: "Cairo, Egypt", cta_label: "", cta_link: "", flip: false, band: "paper" } },
        { id: "quality", type: "steps", settings: { eyebrow: "Behind the quality", title: "Graded like an export *house*.", text: "Nothing reaches your table by accident. Every piece of produce passes through the same four steps the export market demands.", band: "kraft" }, blocks: [
          { type: "step", settings: { title: "Selection", text: "We begin with Egypt's best growers, and only the lots that meet export specification. Most of what fills an ordinary market never makes the cut." } },
          { type: "step", settings: { title: "Grading", text: "Each piece is sorted by hand for size, colour, firmness and ripeness. The rest is set aside — what reaches you has earned its place." } },
          { type: "step", settings: { title: "Cold chain", text: "Produce is cooled within hours of harvest and kept at the right temperature, all the way to your door. Freshness is a logistics problem, and we treat it like one." } },
          { type: "step", settings: { title: "Presentation", text: "Finally, we pack to arrive looking like a gift — because that is increasingly how good produce is used." } },
        ] },
        { id: "numbers", type: "stats", settings: { eyebrow: "By the numbers", title: "Small company. *Serious standards.*", band: "dark" }, blocks: [
          { type: "stat", settings: { value: "100", decimals: 0, suffix: "%", label: "Export-grade selection" } },
          { type: "stat", settings: { value: "5", decimals: 0, suffix: "", label: "Premium areas served" } },
          { type: "stat", settings: { value: "1400", decimals: 0, suffix: "+", label: "Verified orders" } },
          { type: "stat", settings: { value: "4.9", decimals: 1, suffix: "", label: "Average rating" } },
        ] },
        { id: "values", type: "features", settings: { eyebrow: "What we hold to", title: "The things we will not *compromise*.", text: "", cols: 3, numbered: true, band: "paper" }, blocks: [
          { type: "feature", settings: { icon: "shield", title: "Quality over quantity", text: "We would rather sell less, and sell it perfect. Grading is not negotiable." } },
          { type: "feature", settings: { icon: "check", title: "Honesty", text: "If it isn't right, we replace it. 'Export-grade' is a promise, not a label." } },
          { type: "feature", settings: { icon: "sparkle", title: "Care in the detail", text: "From the cold chain to the packaging, the small things are the whole thing." } },
        ] },
        { id: "areas", type: "areas", settings: { eyebrow: "Where we deliver", title: "Close to home, by *design*.", text: "We deliver to the communities we know best — so we can keep the cold chain short and the service personal. Complimentary delivery on orders over EGP 600.", note: "More areas soon.", image: "banner:home-delivery", band: "sage" } },
        { id: "taste", type: "banner", settings: { eyebrow: "Taste it for yourself", title: "Taste the difference *grading* makes.", text: "Start with a best seller, or let us choose for you with a curated box.", image: "banner:door-delivery", cta_label: "Browse the collection", cta_link: "products.html", cta2_label: "The Art of Hosting", cta2_link: "hosting.html" } },
      ] },

      /* ============================ CONTACT ============================ */
      contact: { title: "Contact", sections: [
        { id: "head", type: "page_head", settings: { eyebrow: "We're glad to help", title: "Talk to Fresh *Valley*.", text: "A question about an order, a hosting idea, or a wholesale enquiry — we read everything, and we reply like people.", cta_label: "", cta_link: "", cta2_label: "", cta2_link: "", image: "", caption: "", art: "citrus" } },
        { id: "form", type: "contact", settings: { eyebrow: "Get in touch", title: "Send a *message*", subjects: "An order|A product question|Hosting & events|Corporate & events|Wholesale & partnerships|Something else", note: "We usually reply within one working day.", band: "paper" } },
        { id: "areas", type: "areas", settings: { eyebrow: "Where we deliver", title: "Delivery *areas*", text: "We keep our delivery close to home, so the cold chain stays short and the service stays personal. Complimentary delivery on orders over EGP 600; a flat EGP 45 below that.", note: "Outside these areas? Tell us where you are — we're expanding.", image: "banner:delivery-van", band: "kraft" } },
        { id: "faq", type: "faq", settings: { eyebrow: "Good to know", title: "Common *questions*", text: "Still wondering? Message us on WhatsApp — it's the fastest way to a real person.", band: "paper" }, blocks: [
          { type: "qa", settings: { q: "When will my order arrive?", a: "Choose a next-day delivery slot at checkout — morning, midday, afternoon or evening. We'll send an update by SMS when your produce is on the way." } },
          { type: "qa", settings: { q: "What does 'export-grade' mean?", a: "It is the standard the export market demands: each piece graded by hand for size, colour, firmness and ripeness. Anything that doesn't pass is set aside, so what reaches you is consistent and beautiful." } },
          { type: "qa", settings: { q: "What if something isn't perfect?", a: "Then it isn't on us to keep. Tell us within 24 hours and we'll replace it or refund it — no debate. Quality is the whole promise." } },
          { type: "qa", settings: { q: "Do you offer subscriptions?", a: "Yes. Any box can be set to a weekly or fortnightly schedule from your account, and you can pause or change it any time." } },
          { type: "qa", settings: { q: "How is delivery priced?", a: "Complimentary on orders over EGP 600, and a flat EGP 45 below that, across all our areas." } },
        ] },
      ] },

      /* ============================ JOURNAL ============================ */
      journal: { title: "Journal", sections: [
        { id: "head", type: "page_head", settings: { eyebrow: "Read, cook, host", title: "The Fresh Valley *Journal*.", text: "Recipes, hosting tips and a little produce education — for setting a better table, every week.", cta_label: "", cta_link: "", cta2_label: "", cta2_link: "", image: "", caption: "", art: "sprig" } },
        { id: "list", type: "journal", settings: { eyebrow: "All articles", title: "More from the *Journal*", limit: 0, layout: "magazine", cta_label: "", cta_link: "" } },
        { id: "shop", type: "product_rail", settings: { eyebrow: "Cook along", title: "Straight from the *stories*", text: "", collection: "hosting", limit: 10, cta_label: "Shop the market", cta_link: "products.html", band: "kraft" } },
      ] },

      /* ============================ POLICIES ============================ */
      policies: { title: "Company Policies", sections: [
        { id: "head", type: "page_head", settings: { eyebrow: "The promises behind the produce", title: "Company *Policies*", text: "Plain words about freshness, delivery, returns, payment, subscriptions and your privacy.", cta_label: "", cta_link: "", cta2_label: "", cta2_link: "", image: "", caption: "", art: "leaf", compact: true } },
        { id: "body", type: "legal", settings: { updated: "Last updated: June 2026" }, blocks: [
          { type: "clause", settings: { title: "Freshness & Quality Guarantee", body: "Every order is graded to export standard and cooled within hours of harvest. We stand behind it completely.\n\nIf anything arrives that is not perfect — bruised, under-ripe, or simply not up to standard — tell us within 24 hours of delivery. We will replace it on your next order or refund it, whichever you prefer. No long forms, no debate. Quality is the whole promise, and we treat it that way." } },
          { type: "clause", settings: { title: "Delivery", body: "- We deliver across New Cairo, Sheikh Zayed, October, Madinaty and Rehab.\n- Complimentary delivery on orders over EGP 600.\n- A flat EGP 45 delivery fee on orders below EGP 600.\n- Next-day slots: morning (9–12), midday (12–3), afternoon (3–6) and evening (6–9).\n- You'll receive an SMS update when your produce is on its way.\n\nIf you are not home, our driver will call. We keep produce cold in transit, so a short wait does it no harm." } },
          { type: "clause", settings: { title: "Returns & Replacements", body: "Because we sell fresh produce, we do not accept general returns for change of mind. What we do offer is simpler and more generous:\n\n- Quality issues: reported within 24 hours are replaced or refunded in full.\n- Wrong or missing items: we send the correct item, or refund it, right away.\n- Boxes: contents adapt to the season; if a substitution isn't to your taste, let us know and we'll make it right." } },
          { type: "clause", settings: { title: "Payment", body: "We accept credit and debit cards (Visa, Mastercard), Apple Pay, mobile wallets, and cash on delivery.\n\nCard payments are processed by a certified payment provider. We never see or store your full card number — saved cards are held securely with our provider, not on our servers. Prices are shown in Egyptian Pounds (EGP) and include applicable taxes." } },
          { type: "clause", settings: { title: "Subscriptions", body: "Any box can be set to a weekly or fortnightly schedule. You are always in control:\n\n- Pause, skip or change your delivery day at any time from your account.\n- Cancel whenever you like — there is no minimum commitment.\n- We'll remind you before each charge, so there are never surprises." } },
          { type: "clause", settings: { title: "Privacy", body: "We collect only what we need to deliver your order well: your name, contact details, address and order history. We use it to serve you, and to send the updates and seasonal notes you've asked for.\n\nWe do not sell your data. You can ask us to update or delete your information at any time by writing to hello@freshvalley.eg. For the full detail, see our Terms of Use." } },
          { type: "clause", settings: { title: "Questions", body: "If anything here is unclear, please ask. We'd rather explain than leave you guessing — get in touch through our contact page." } },
        ] },
      ] },

      /* ============================ TERMS ============================ */
      terms: { title: "Terms of Use", sections: [
        { id: "head", type: "page_head", settings: { eyebrow: "The fine print, kept plain", title: "Terms of *Use*", text: "The agreement between you and Fresh Valley when you browse, order and manage your account.", cta_label: "", cta_link: "", cta2_label: "", cta2_link: "", image: "", caption: "", art: "sprig", compact: true } },
        { id: "body", type: "legal", settings: { updated: "Last updated: June 2026" }, blocks: [
          { type: "clause", settings: { title: "Welcome", body: "These terms govern your use of the Fresh Valley website and services. By browsing the site or placing an order, you agree to them. We've tried to keep them clear — if anything is unclear, please ask us.\n\nFresh Valley is a premium produce company based in Cairo, Egypt." } },
          { type: "clause", settings: { title: "Using our site", body: "You may use this site to browse, order, and manage your account. In return, you agree to:\n\n- provide accurate contact and delivery information;\n- use the site lawfully, and not attempt to disrupt or misuse it;\n- keep your account details private and secure." } },
          { type: "clause", settings: { title: "Orders & pricing", body: "All prices are shown in Egyptian Pounds (EGP) and include applicable taxes. Delivery fees are shown at checkout.\n\nBecause we sell fresh, seasonal produce, availability can change. If an item becomes unavailable after you order, we will offer a suitable substitute or a refund for that item. Box contents adapt to the season by design.\n\nAn order is confirmed once you receive our confirmation. We reserve the right to decline or cancel an order — for example, if it falls outside our delivery areas or an item is genuinely unavailable." } },
          { type: "clause", settings: { title: "Your account", body: "You are responsible for activity on your account and for keeping your password safe. Tell us promptly if you believe your account has been used without your permission. You can close your account at any time." } },
          { type: "clause", settings: { title: "Intellectual property", body: "The Fresh Valley name, logo, photography, written content and design are owned by Fresh Valley and protected by law. You may not copy, reproduce or reuse them without our written permission." } },
          { type: "clause", settings: { title: "Liability", body: "We take great care with your produce and your data. To the extent permitted by law, Fresh Valley is not liable for indirect or unforeseeable losses. Nothing in these terms limits your rights under Egyptian consumer law, or our responsibility for matters that cannot be excluded by law." } },
          { type: "clause", settings: { title: "Governing law", body: "These terms are governed by the laws of the Arab Republic of Egypt, and any dispute will be subject to the jurisdiction of the Egyptian courts." } },
          { type: "clause", settings: { title: "Changes", body: "We may update these terms from time to time. The latest version will always be posted here, with the date it took effect. Continuing to use the site means you accept the current terms." } },
          { type: "clause", settings: { title: "Contact", body: "Questions about these terms? Write to hello@freshvalley.eg or visit our contact page." } },
        ] },
      ] },
    },
  };

  /* ------------------------------------------------------------------ *
   * Resolution
   * ------------------------------------------------------------------ */
  const KEY = "fv_theme";
  const clone = (o) => JSON.parse(JSON.stringify(o));
  function readLocal() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (_) { return null; } }
  function merge(base, over) {
    if (!over || typeof over !== "object") return base;
    const out = clone(base);
    if (over.settings) {
      Object.keys(over.settings).forEach((k) => {
        const v = over.settings[k];
        out.settings[k] = (v && typeof v === "object" && !Array.isArray(v) && out.settings[k] && typeof out.settings[k] === "object" && !Array.isArray(out.settings[k]))
          ? Object.assign({}, out.settings[k], v) : v;
      });
    }
    // pages are replaced whole — a section list cannot be merged meaningfully
    if (over.pages) Object.keys(over.pages).forEach((k) => { if (over.pages[k] && Array.isArray(over.pages[k].sections)) out.pages[k] = over.pages[k]; });
    out.updatedAt = over.updatedAt || out.updatedAt;
    return out;
  }
  // The theme editor writes its working copy here before (re)loading the
  // preview iframe (same tab → same sessionStorage), so the header/footer
  // are built from the draft on first paint.
  let draft = null;
  if (/[?&]fv_preview=1/.test(location.search)) { try { draft = JSON.parse(sessionStorage.getItem("fv_theme_draft")); } catch (_) { draft = null; } }
  let cache = null;
  function source() {
    const pub = window.FV_CONTENT && window.FV_CONTENT.theme ? window.FV_CONTENT.theme : null;
    const loc = readLocal();
    if (pub && loc) return (loc.updatedAt || 0) >= (pub.updatedAt || 0) ? loc : pub;
    return loc || pub;
  }
  function get() {
    if (draft) return merge(DEFAULTS, draft);
    if (!cache) cache = merge(DEFAULTS, source());
    return cache;
  }

  return {
    defaults: () => clone(DEFAULTS),
    get,
    settings: () => get().settings,
    page: (key) => get().pages[key] || null,
    isCustom: () => !!(draft || source()),
    setDraft(t) { draft = t; cache = null; },
    save(t) { t.updatedAt = Date.now(); localStorage.setItem(KEY, JSON.stringify(t)); cache = null; return t; },
    reset() { localStorage.removeItem(KEY); cache = null; },
    KEY,
  };
})();
