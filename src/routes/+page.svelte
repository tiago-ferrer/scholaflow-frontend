<script lang="ts">
  import LandingNav     from '$lib/components/marketing/LandingNav.svelte'
  import HeroSection    from '$lib/components/marketing/HeroSection.svelte'
  import FeatureGrid    from '$lib/components/marketing/FeatureGrid.svelte'
  import FeatureDetail  from '$lib/components/marketing/FeatureDetail.svelte'
  import SocialProof    from '$lib/components/marketing/SocialProof.svelte'
  import WaitlistForm   from '$lib/components/marketing/WaitlistForm.svelte'
  import CtaSection     from '$lib/components/marketing/CtaSection.svelte'
  import LandingFooter  from '$lib/components/marketing/LandingFooter.svelte'
  import LoginModal     from '$lib/components/marketing/LoginModal.svelte'

  let loginOpen = $state(false)
</script>

<svelte:head>
  <title>Scholaflow — Research, Organized</title>
  <meta name="description" content="Scholaflow brings together notebooks, references, Kanban boards, and AI transcription for researchers and academics. Currently in Beta — join the waitlist." />
</svelte:head>

<LandingNav onOpenLogin={() => loginOpen = true} />

<main>
  <HeroSection onOpenLogin={() => loginOpen = true} />
  <FeatureGrid />
  <FeatureDetail />
  <SocialProof />
  <WaitlistForm />
  <CtaSection onOpenLogin={() => loginOpen = true} />
</main>

<LandingFooter />

<LoginModal open={loginOpen} onclose={() => loginOpen = false} />

<style>
  :global(html) {
    scroll-behavior: smooth;
  }
</style>
