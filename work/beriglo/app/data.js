// Catalogue and content taken from beriglo.com (product pages, ritual pages, policies) on 4 Oct 2026.
// Ratings and review counts are each product's own Judge.me figures. Nothing here is invented;
// where the site gives no information (e.g. pack size), the prototype shows nothing.
const CDN = "https://beriglo.com/cdn/shop/files/";
const LOGO = CDN + "BERIGLO_logo_black.svg?height=90&v=1789904017";
const HERO = "photo-Sep_29_2026_at_05_35_13_AM.png?v=1790640338";
// Portfolio build: every photo is bundled in img/ (one 1000px JPEG each), so the published copy is self-contained.
const localName = f => f.split("?")[0].replace(/\.[a-z]+$/i, "").replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 60) + ".jpg";
const img = (f, w) => "img/" + localName(f);
const srcset = f => `${img(f)} 1000w`;

// Prototype switches. Set PROTOTYPE to false for a production build: hides the demo-login notice.
const PROTOTYPE = true;
const CREDIT = "Concept by Nehal Sharma";   // shown on the prototype label
const DEMO_ACCOUNT = { name: "Demo Shopper", email: "demo@beriglo.test", password: "beriglo123" };

// Store-wide facts, worded from beriglo.com's own banner and policies.
const STORE = {
  rating: 4.55, reviews: 523,
  delivery: "4–5 days after dispatch",
  support: "info.beriglo@gmail.com",
  returns: "Damaged, leaked or defective? Tell us within 7 days of delivery and we'll arrange a pickup.",
};

const PRODUCTS = [
  {id:"smoothing-shampoo", cat:"hair", name:"Smoothing Shampoo", kind:"Shampoo", price:460, rating:4.53, reviews:78, img:"IMG-1168.png?v=1790586255",
   desc:"A smoothing shampoo designed to cleanse the hair while helping control frizz and leave hair feeling softer, smoother and naturally polished.",
   short:"Cleanses while helping control frizz, for softer, smoother hair.", ingr:["Pea Protein","Biotin","Aloe Vera Extract","Dashamoola Extract"],
   does:"Gently cleanses the scalp and hair while supporting smoother, stronger-looking and shinier hair. It helps remove impurities and supports scalp and hair health.",
   who:"Suitable for regular use and for routines focused on smoother, stronger-looking and shinier hair. It also fits the Anti-Hairfall Ritual for hair fall, breakage, weak hair and frizz-related concerns.",
   how:"Apply on wet scalp and hair. Massage gently, then rinse thoroughly. Suitable for regular use.",
   concerns:["hairfall","frizz"]},
  {id:"deep-cleansing-shampoo", cat:"hair", name:"Deep Cleansing Shampoo", kind:"Shampoo", price:480, rating:4.62, reviews:55, img:"40893CE5-6269-4FAD-BA0C-D6B44A383D6F.png?v=1790586445",
   desc:"A deep cleansing shampoo designed to remove buildup and leave hair feeling fresh, clean and refreshed.",
   short:"Removes buildup and leaves hair feeling fresh and clean.", ingr:["Panthenol","Aloe Vera Extract","Glycerin"],
   does:"Deeply cleanses the scalp and hair, helping remove excess oil and product build-up while providing a more voluminous, bouncy lift.",
   who:"Recommended for oily scalp, dull and lifeless hair, product build-up, and hair exposed to pollution.",
   how:"Apply on wet hair, lather and rinse.",
   concerns:["oily"]},
  {id:"anti-hairfall-serum", cat:"hair", name:"Anti-Hairfall Serum", kind:"Scalp serum", price:750, rating:4.38, reviews:45, img:"B338839A-5700-4FF3-99E1-492135A70D98.png?v=1790586874",
   desc:"A targeted scalp serum designed to support healthier-looking hair and scalp care while helping reduce hair fall.",
   short:"Targeted scalp care that helps reduce hair fall.", ingr:["Redensyl®","Procapil™","Baicapil™","Caffeine"],
   does:"A targeted scalp serum designed to help reduce hair fall and support stronger, healthier-looking hair. It is designed to target the scalp and support the hair follicles.",
   who:"Recommended for hair fall, hair breakage, weak hair and frizzy hair. Suitable for all hair types.",
   how:"Apply 10–12 drops directly to the scalp and leave for 6–8 hours before washing.",
   concerns:["hairfall"]},
  {id:"revital-hair-mask", cat:"hair", name:"Revital Hair Mask", kind:"Hair mask", price:680, rating:4.66, reviews:58, img:"42E25BA4-2748-4180-9858-B78F63397391.png?v=1790586909",
   desc:"A nourishing hair mask designed to moisturise, soften and condition the hair while helping improve the appearance of frizz and dryness.",
   short:"Moisturises and softens, helping with frizz and dryness.", ingr:["Shea Butter","Argan Oil","Glycerin","Panthenol"],
   does:"A deep-conditioning hair mask designed to nourish and strengthen the hair while supporting moisture, softness, smoothness and shine. It also helps with frizz control.",
   who:"Particularly suited to routines focused on frizz, dryness, damage, nourishment, softness and smoother-looking hair.",
   how:"After shampooing, apply a generous amount to damp hair, focusing on the lengths and ends. Leave for 5–10 minutes, then rinse thoroughly.",
   concerns:["frizz"]},
  {id:"dew-face-wash", cat:"skin", name:"Dew Face Wash", kind:"Face wash", price:299, rating:4.68, reviews:60, img:"7E326256-36BC-4322-8C39-F5A705FAAA07.png?v=1790587000",
   desc:"A gentle face wash designed to remove impurities and excess oil while helping maintain the skin’s moisture balance, leaving skin feeling fresh, soft and revitalised.",
   short:"Removes impurities and oil without stripping moisture.", ingr:["Niacinamide","Panthenol","Glycerin"],
   does:"Removes impurities and excess oil while helping maintain the skin's natural moisture balance, leaving skin feeling fresh, soft and revitalised.",
   who:"Suitable for routines focused on cleansing, excess oil and maintaining moisture balance.",
   how:"Use as the cleansing step of your routine.",
   concerns:["acne","basics"]},
  {id:"rice-scrub", cat:"skin", name:"Rice Scrub", kind:"Exfoliator", price:480, rating:4.48, reviews:42, img:"C96E87CA-808A-4358-8A90-B33F9DE71200.png?v=1790587050",
   desc:"A gentle exfoliating rice scrub designed to remove dead skin cells, impurities and excess oil while helping leave skin feeling smoother, brighter and more even-looking.",
   short:"Gently exfoliates for smoother, more even-looking skin.", ingr:["Rice Beads","Niacinamide","Glycerin"],
   does:"Helps remove dead skin cells, impurities and excess oil while promoting a smoother, brighter and more even-looking complexion.",
   who:"For pigmentation, uneven skin tone, dark spots, sun tan, blackheads, clogged pores, whiteheads and rough skin texture.",
   how:"Use as the exfoliating first step of your routine.",
   concerns:["pigment","blackheads"]},
  {id:"radiance-serum", cat:"skin", name:"Radiance Serum", kind:"Brightening serum", price:650, rating:4.45, reviews:40, img:"ECA46D02-30E4-4218-8723-413D4B887A0B.png?v=1790587109",
   desc:"A brightening face serum designed to reduce the appearance of dullness and support a smoother, more luminous-looking complexion.",
   short:"Reduces the look of dullness for a more luminous complexion.", ingr:["Niacinamide","Vitamin C","Ferulic Acid","Sodium Hyaluronate"],
   does:"Helps protect against environmental stressors, reduce dullness and support a smoother, more luminous complexion.",
   who:"For dullness, uneven-looking skin tone, dark spots and sun tan.",
   how:"Apply after cleansing or exfoliation, and before moisturiser.",
   concerns:["dull","pigment"]},
  {id:"sheen-serum", cat:"skin", name:"Sheen Serum", kind:"Clarifying serum", price:650, rating:4.32, reviews:38, img:"AF077B40-8D3C-4D8D-AA56-3C7B1F7A2ED3.png?v=1790587109",
   desc:"A clarifying face serum designed to support clearer-looking, smoother skin while helping improve the appearance of uneven texture and dullness.",
   short:"Supports clearer, smoother skin and more even texture.", ingr:["Niacinamide","AHA","BHA","PHA"],
   does:"Helps improve skin clarity, boost radiance and support the skin barrier for a smoother, healthy-looking glow.",
   who:"For acne-prone skin, clogged pores, excess oil, uneven skin texture, blackheads, whiteheads and rough skin texture.",
   how:"Apply after cleansing or exfoliation, and before moisturiser.",
   concerns:["acne","blackheads"]},
  {id:"spesh-hydra-gel-moisturiser", cat:"skin", name:"Spesh Hydra Gel Moisturiser", kind:"Gel moisturiser", price:600, rating:4.64, reviews:55, img:"D338E97E-1D22-43CB-BB5F-2E42F94AB073.png?v=1790587257",
   desc:"A lightweight gel moisturiser designed to hydrate and moisturise the skin while helping support the skin barrier, leaving skin feeling soft, smooth and refreshed.",
   short:"Lightweight hydration that supports the skin barrier.", ingr:["Niacinamide","Ceramide Complex","Alpha Arbutin"],
   does:"Helps improve skin texture, lock in moisture, support the skin barrier and promote long-lasting softness and radiance.",
   who:"For routines that need hydration, moisture retention, barrier support and softness.",
   how:"Apply after the serum and before SPF.",
   concerns:["basics"]},
  {id:"advanced-uv-protection-spf-moisturizer", cat:"skin", name:"Advanced UV Protection SPF Moisturizer", kind:"SPF moisturiser", price:420, rating:4.60, reviews:52, img:"C74EB15E-F29D-4FAF-81A1-46FDF0120F2B.png?v=1790587285",
   desc:"A lightweight daily moisturiser with broad-spectrum UVA and UVB protection, designed to help protect and moisturise the skin while supporting the skin barrier.",
   short:"Daily UVA/UVB protection that moisturises and supports the barrier.", ingr:["Zinc Oxide","Ceramide Complex","Phospholipids"],
   does:"Offers broad-spectrum protection against UVA and UVB rays while supporting the skin barrier, helping prevent moisture loss and leaving a smooth, lightweight finish.",
   who:"For routines that include UVA/UVB protection, moisture retention and skin-barrier support.",
   how:"Apply as the final step of your routine, after moisturiser.",
   concerns:["basics"]},
];

// Duos: contents, "why together" and "how to use" from each duo's product page. No reviews yet on any duo.
const BUNDLES = [
  {id:"smoothing-hair-care-duo", concerns:["frizz"], cat:"hair", name:"Smoothing Hair Care Duo", price:999, img:"photo-Sep29_2026at02_55_57AM.png?v=1790630828",
   desc:"A simple two-step hair care pairing designed to cleanse, smooth and nourish your hair for a softer, more polished finish.",
   items:["smoothing-shampoo","revital-hair-mask"],
   why:"Smoothing Shampoo gently cleanses the hair while supporting a smoother, shinier finish. Revital Hair Mask follows with deeper conditioning and nourishment for softer, more manageable hair.",
   how:"Start with Smoothing Shampoo on wet scalp and hair. Massage gently and rinse thoroughly. Follow with Revital Hair Mask, applying generously to damp lengths and ends. Leave for 5–10 minutes, then rinse thoroughly."},
  {id:"hairfall-care-duo", concerns:["hairfall"], cat:"hair", name:"Hairfall Care Duo", price:1099, img:"photo-Sep29_2026at02_55_41AM_b0c84b06-284d-481a-81d8-780dd5966fc2.png?v=1790630879",
   desc:"A simple two-step hair care pairing designed to support scalp care while cleansing and smoothing the hair.",
   items:["anti-hairfall-serum","smoothing-shampoo"],
   why:"Anti-Hairfall Serum provides targeted scalp care, while Smoothing Shampoo gently cleanses the scalp and hair.",
   how:"Apply 10–12 drops of Anti-Hairfall Serum directly to the scalp and leave for 6–8 hours before washing. Follow with Smoothing Shampoo on wet scalp and hair. Massage gently, then rinse thoroughly."},
  {id:"deep-clean-hair-duo", concerns:["oily"], cat:"hair", name:"Deep Clean Hair Duo", price:999, img:"photo-Sep29_2026at02_55_49AM.png?v=1790630904",
   desc:"A simple two-step hair care pairing designed to deeply cleanse, refresh and nourish the hair.",
   items:["deep-cleansing-shampoo","revital-hair-mask"],
   why:"Deep Cleansing Shampoo gives a more thorough cleanse to help remove excess oil and product build-up, while Revital Hair Mask follows with nourishment and conditioning.",
   how:"Apply Deep Cleansing Shampoo to wet hair, lather and rinse thoroughly. Follow with Revital Hair Mask, applying generously to damp lengths and ends. Leave for 5–10 minutes, then rinse thoroughly."},
  {id:"daily-skin-duo", concerns:["basics"], cat:"skin", name:"Daily Skin Duo", price:799, img:"photo-Sep29_2026at02_51_40AM.png?v=1790630959",
   desc:"A simple daily skin care pairing designed to cleanse and hydrate for fresh, comfortable-feeling skin.",
   items:["dew-face-wash","spesh-hydra-gel-moisturiser"],
   why:"Dew Face Wash cleanses away impurities and excess oil while helping maintain moisture balance. Spesh Hydra Gel Moisturiser follows with hydration and barrier support.",
   how:"Start with Dew Face Wash as the cleansing step. Rinse thoroughly, then apply Spesh Hydra Gel Moisturiser as the moisturising step."},
  {id:"brightening-skin-duo", concerns:["dull"], cat:"skin", name:"Brightening Skin Duo", price:849, img:"photo-Sep29_2026at02_52_02AM.png?v=1790631257",
   desc:"A simple skin care pairing designed to cleanse and support a brighter, more radiant-looking complexion.",
   items:["dew-face-wash","radiance-serum"],
   why:"Dew Face Wash provides a clean starting point while helping maintain moisture balance. Radiance Serum follows with Vitamin C, Ferulic Acid and hydration support to help reduce dullness.",
   how:"Start with Dew Face Wash as the cleansing step. After cleansing, apply Radiance Serum as the treatment step."},
  {id:"daily-glow-duo", concerns:["dull"], cat:"skin", name:"Daily Glow Duo", price:949, img:"photo-Sep29_2026at02_52_20AM.png?v=1790631437",
   desc:"A simple daily pairing designed to support radiance while moisturising and helping protect the skin.",
   items:["radiance-serum","advanced-uv-protection-spf-moisturizer"],
   why:"Radiance Serum is a treatment step focused on reducing dullness. Advanced UV Protection SPF Moisturizer follows with daily UVA and UVB protection, moisturisation and barrier support.",
   how:"Apply Radiance Serum as the treatment step after cleansing. Follow with Advanced UV Protection SPF Moisturizer as the final step of your routine."},
  {id:"exfoliation-hydration-duo", concerns:["blackheads"], cat:"skin", name:"Exfoliation + Hydration Duo", price:1099, img:"photo-Sep29_2026at02_52_37AM.png?v=1790631464",
   desc:"A simple skin care pairing designed to support smoother-looking skin while providing lightweight hydration.",
   items:["sheen-serum","spesh-hydra-gel-moisturiser"],
   why:"Sheen Serum combines brightening and exfoliating actives to help improve skin clarity and texture. Spesh Hydra Gel Moisturiser follows with hydration and barrier support.",
   how:"Apply Sheen Serum as the treatment step after cleansing or exfoliation. Follow with Spesh Hydra Gel Moisturiser as the moisturising step."},
];

// Rituals: steps are [role, productId, how-to for that step], from each ritual page.
const RITUALS = [
  {id:"anti-hairfall-ritual", concerns:["hairfall", "frizz"], cat:"hair", name:"Anti-Hairfall Ritual", price:1319, img:"04D1EB8B-A347-4B53-9E80-E1C5BE70D700.png?v=1790669308",
   desc:"A structured hair care ritual designed to support targeted scalp care, cleansing and nourishment.",
   who:"Designed for routines focused on hair fall, hair breakage, weak hair and frizz.",
   why:"The Anti-Hairfall Serum begins with targeted scalp care, followed by Smoothing Shampoo for cleansing and Revital Hair Mask for nourishment and conditioning. Together, the three steps cover scalp to lengths.",
   steps:[["Targeted scalp care","anti-hairfall-serum","Apply 10–12 drops directly to the scalp and leave for 6–8 hours before washing."],
          ["Cleanse and smooth","smoothing-shampoo","Wash the hair with Smoothing Shampoo after the serum treatment."],
          ["Nourish and condition","revital-hair-mask","Apply the hair mask after shampooing and leave for 3–5 minutes before rinsing."]]},
  {id:"salon-finish-ritual", concerns:["oily"], cat:"hair", name:"Salon Finish Ritual", price:1339, img:"168A0CF6-7F31-43AF-BD7A-977F2864FBE6.png?v=1790669336",
   desc:"A structured hair care ritual for a cleaner, fresher and more polished hair feel.",
   who:"Designed for routines focused on oily scalp, dull and lifeless hair, product build-up and hair exposed to pollution.",
   why:"The Anti-Hairfall Serum provides targeted scalp care, Deep Cleansing Shampoo provides a more thorough cleanse, and Revital Hair Mask follows with nourishment.",
   steps:[["Targeted scalp care","anti-hairfall-serum","Apply 10–12 drops directly to the scalp and leave for 6–8 hours before washing."],
          ["Deep cleanse","deep-cleansing-shampoo","Use to cleanse the hair and scalp after the serum treatment."],
          ["Nourish and condition","revital-hair-mask","Apply the hair mask after shampooing and leave for 3–5 minutes before rinsing."]]},
  {id:"radiance-face-ritual", concerns:["dull"], cat:"skin", name:"Radiance Face Ritual", price:1379, img:"C8B36E02-3DBD-4B9E-85EE-F9F68EE88693.png?v=1790669372",
   desc:"A complete skin care ritual designed to cleanse, treat, hydrate and protect for a healthy-looking radiance.",
   who:"Designed around cleansing, radiance-focused treatment, lightweight hydration and daily UV protection.",
   why:"Dew Face Wash cleanses, Radiance Serum targets uneven-looking skin tone and enhances radiance, Spesh Hydra Gel Moisturiser hydrates, and the SPF Moisturizer finishes with daily UV protection.",
   steps:[["Cleanse","dew-face-wash","Cleanse the face with Dew Face Wash."],
          ["Treat and brighten","radiance-serum","Apply Radiance Serum after cleansing."],
          ["Hydrate and moisturise","spesh-hydra-gel-moisturiser","Apply the gel moisturiser after the treatment step."],
          ["Protect and moisturise","advanced-uv-protection-spf-moisturizer","Apply the SPF Moisturizer as the final step."]]},
  {id:"anti-acne-face-ritual", concerns:["acne"], cat:"skin", name:"Anti-Acne Face Ritual", price:1379, img:"B3402216-9E8F-44D4-9D9F-42F446040F9E.png?v=1790669416",
   desc:"A complete skin care ritual designed to cleanse, treat, hydrate and protect acne-prone skin.",
   who:"Designed for acne-prone skin, clogged pores, excess oil and uneven skin texture.",
   why:"Dew Face Wash provides a clean starting point, Sheen Serum is the treatment step, Spesh Hydra Gel Moisturiser hydrates, and the SPF Moisturizer completes the routine with daily UV protection.",
   steps:[["Cleanse","dew-face-wash","Cleanse the face with Dew Face Wash."],
          ["Treat and clarify","sheen-serum","Apply Sheen Serum after cleansing."],
          ["Hydrate and moisturise","spesh-hydra-gel-moisturiser","Apply the gel moisturiser after the treatment step."],
          ["Protect and moisturise","advanced-uv-protection-spf-moisturizer","Apply the SPF Moisturizer as the final step."]]},
  {id:"pigmentation-d-tan-ritual", concerns:["pigment"], cat:"skin", name:"Pigmentation & D-Tan Ritual", price:1499, img:"photo-May_31_2026_at_01_37_46_AM.png?v=1790890045",
   desc:"A complete skin care ritual designed to exfoliate, treat, hydrate and protect for a more even-looking complexion.",
   who:"Designed for routines focused on pigmentation, uneven skin tone, dark spots and sun tan.",
   why:"Rice Scrub gently exfoliates, Radiance Serum follows with radiance and uneven-tone care, Spesh Hydra Gel Moisturiser provides hydration and barrier support, and the SPF Moisturizer adds daily UV protection.",
   steps:[["Exfoliate","rice-scrub","Use Rice Scrub to exfoliate the skin."],
          ["Treat and brighten","radiance-serum","Apply Radiance Serum after exfoliating."],
          ["Hydrate and moisturise","spesh-hydra-gel-moisturiser","Apply the gel moisturiser after the treatment step."],
          ["Protect and moisturise","advanced-uv-protection-spf-moisturizer","Apply the SPF Moisturizer as the final step."]]},
  {id:"blackhead-whitehead-ritual", concerns:["blackheads"], cat:"skin", name:"Blackhead Whitehead Ritual", price:1499, img:"IMG_1263.jpg?v=1790915205",
   desc:"A complete skin care ritual designed to exfoliate, clarify, hydrate and protect for smoother-looking skin.",
   who:"Designed for blackheads, whiteheads, clogged pores and rough skin texture.",
   why:"Rice Scrub exfoliates, Sheen Serum clarifies, Spesh Hydra Gel Moisturiser hydrates, and the SPF Moisturizer adds daily UV protection.",
   steps:[["Exfoliate","rice-scrub","Use Rice Scrub to exfoliate the skin."],
          ["Treat and clarify","sheen-serum","Apply Sheen Serum after exfoliating."],
          ["Hydrate and moisturise","spesh-hydra-gel-moisturiser","Apply the gel moisturiser after the treatment step."],
          ["Protect and moisturise","advanced-uv-protection-spf-moisturizer","Apply the SPF Moisturizer as the final step."]]},
];

// Concerns drive the routine finder and the shop filters. Tags come from each item's own "Who is it for?" / description.
const CONCERNS = {
  hair: [
    {key:"hairfall", label:"Hair fall", match:"anti-hairfall-ritual"},
    {key:"oily", label:"Buildup & oily scalp", match:"salon-finish-ritual"},
    {key:"frizz", label:"Frizz & dryness", match:"smoothing-hair-care-duo"},
  ],
  skin: [
    {key:"dull", label:"Dullness", match:"radiance-face-ritual"},
    {key:"acne", label:"Acne-prone skin", match:"anti-acne-face-ritual"},
    {key:"pigment", label:"Pigmentation & tan", match:"pigmentation-d-tan-ritual"},
    {key:"blackheads", label:"Blackheads & whiteheads", match:"blackhead-whitehead-ritual"},
    {key:"basics", label:"Just the daily basics", match:"daily-skin-duo"},
  ],
};

// Review quotes as shown on the beriglo.com homepage (store-wide Judge.me reviews).
const REVIEWS = [
  ["Feels comfortable and spreads easily over the skin.","Ayush Sethi","advanced-uv-protection-spf-moisturizer"],
  ["The texture is light and absorbs quickly.","Ishita Verma","radiance-serum"],
  ["Easy to layer with serum and sunscreen.","Pooja Khanna","spesh-hydra-gel-moisturiser"],
  ["Lightweight on the skin and easy to use in the morning.","Meera Shah","advanced-uv-protection-spf-moisturizer"],
  ["Works well when I want hydration without a heavy finish.","Aditya Bansal","spesh-hydra-gel-moisturiser"],
  ["A convenient daily moisturizer with sun protection.","Anika Naik","advanced-uv-protection-spf-moisturizer"],
];

const STATES = ["Andaman and Nicobar Islands","Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chandigarh","Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jammu and Kashmir","Jharkhand",
  "Karnataka","Kerala","Ladakh","Lakshadweep","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha",
  "Puducherry","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];

const P = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
const B = Object.fromEntries(BUNDLES.map(b => [b.id, b]));
const R = Object.fromEntries(RITUALS.map(r => [r.id, r]));
const CAT_NAME = {hair:"Hair Care", skin:"Skin Care"};
