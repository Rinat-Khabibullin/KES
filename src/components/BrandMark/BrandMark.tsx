function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 64 64" role="img" aria-label="Знак Электрика Туапсе">
      <defs>
        <linearGradient id="brand-face" x1="12" x2="52" y1="8" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#233244" />
          <stop offset="0.56" stopColor="#111923" />
          <stop offset="1" stopColor="#0A0F16" />
        </linearGradient>
        <linearGradient id="brand-stroke" x1="9" x2="55" y1="7" y2="57" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7BE7FF" />
          <stop offset="0.48" stopColor="#129BFF" />
          <stop offset="1" stopColor="#FFB020" />
        </linearGradient>
      </defs>
      <path
        className="brand-mark__halo"
        d="M32 4.8 53.2 13v16.9c0 13.1-8.3 22.9-21.2 29.3C19.1 52.8 10.8 43 10.8 29.9V13L32 4.8Z"
      />
      <path
        className="brand-mark__shield"
        d="M32 6.5 51.4 14v15.4c0 12.2-7.5 21.2-19.4 27.2-11.9-6-19.4-15-19.4-27.2V14L32 6.5Z"
      />
      <path className="brand-mark__inner" d="M32 12.4 45.6 17.5v10.9c0 8.5-5.2 14.9-13.6 19.2-8.4-4.3-13.6-10.7-13.6-19.2V17.5L32 12.4Z" />
      <path className="brand-mark__bolt" d="M34.7 16.5 24.5 32h7.3l-3.5 15.3 11.1-18.6h-7.6l2.9-12.2Z" />
      <path className="brand-mark__trace" d="M20 24.2h6.8M37.2 39.4H44M20 39.4h4.8" />
      <circle className="brand-mark__node" cx="20" cy="24.2" r="1.8" />
      <circle className="brand-mark__node brand-mark__node--amber" cx="44" cy="39.4" r="1.8" />
    </svg>
  );
}

export default BrandMark;
