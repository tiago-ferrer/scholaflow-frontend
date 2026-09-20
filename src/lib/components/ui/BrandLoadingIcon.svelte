<script lang="ts">
  interface Props { size?: number }
  let { size = 32 }: Props = $props()
</script>

<svg
  class="brand-loading-icon"
  style:width="{size}px"
  style:height="{size}px"
  viewBox="0 0 1024 1024"
  aria-label="Loading"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    class="petal petal-1"
    d="M 512 820 Q 465.27506801430684 539.7090248849736 249.17933536874898 430.3523408991304 Q 269.622200891317 671.6785501040699 512 820 Z"
    fill="rgb(68,126,226)"
  />
  <path
    class="petal petal-2"
    d="M 512 820 Q 578.5078823419875 543.7339116243465 422.3197721730239 358.63522377959794 Q 346.8438670483388 588.7648345332111 512 820 Z"
    fill="rgb(75,118,189)"
  />
  <path
    class="petal petal-3"
    d="M 512 820 Q 677.1561329516611 588.7648345332111 601.6802278269761 358.63522377959794 Q 445.49211765801243 543.7339116243465 512 820 Z"
    fill="rgb(82,111,151)"
  />
  <path
    class="petal petal-4"
    d="M 512 820 Q 754.377799108683 671.6785501040699 774.820664631251 430.3523408991304 Q 558.7249319856932 539.7090248849736 512 820 Z"
    fill="rgb(89,103,114)"
  />
</svg>

<style>
  .brand-loading-icon {
    display: inline-block;
  }
  .petal {
    transform-origin: 512px 820px;
    transform: scale(0);
    animation: brand-bloom 3s ease-in-out infinite;
  }
  .petal-1 { animation-delay: 0s; }
  .petal-2 { animation-delay: -0.15s; }
  .petal-3 { animation-delay: -0.3s; }
  .petal-4 { animation-delay: -0.45s; }
  @keyframes brand-bloom {
    0%, 100% { transform: scale(0); }
    20%, 30% { transform: scale(1); }
    50% { transform: scale(0); }
  }
</style>
