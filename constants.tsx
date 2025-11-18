import React from 'react';

// --- ICONS FOR NEW EDITOR UI ---

export const ShareIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.186 2.25 2.25 0 0 0-3.933 2.186Z" />
  </svg>
);

export const MoreIconHorizontal = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
  </svg>
);

export const ChevronRightIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

export const ChevronDownIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

export const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
);

export const ArrowUturnLeftIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
    </svg>
);

export const ArrowUturnRightIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" />
    </svg>
);

export const BoldIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M3.5 4.5a2.5 2.5 0 0 1 .6-1.612A2.431 2.431 0 0 1 5.612 2.5h3.418c1.64 0 2.97 1.33 2.97 2.97 0 1.206-.714 2.24-1.732 2.674l.118.118a.75.75 0 0 1-1.06 1.06l-.118-.118V14.5a.75.75 0 0 1-1.5 0V9.75H5.75a.75.75 0 0 1 0-1.5h2.888C9.44 8.25 10 7.69 10 7c0-.938-.762-1.7-1.7-1.7H5.612c-.52 0-.987.21-1.312.55A1.003 1.003 0 0 0 4 6.5v-2Zm2.112 10.15a1 1 0 0 0-1.06-.05A1.003 1.003 0 0 0 4 15.5v2a1 1 0 0 0 .551.894c.325.34.792.556 1.313.556h4.874c1.64 0 2.97-1.33 2.97-2.97s-1.33-2.97-2.97-2.97H6.388a.75.75 0 0 1-.776-1.026l.004-.008.008-.004a.75.75 0 0 1 1.026.776H10.75c.938 0 1.7.762 1.7 1.7s-.762 1.7-1.7 1.7H5.612Z" />
    </svg>
);

export const ItalicIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M3.5 4.5a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H6.533l-1.03 7.727H7.25a.75.75 0 0 1 0 1.5H4.25a.75.75 0 0 1-.743-1.02l1.027-7.707H3.5a.75.75 0 0 1-.75-.75ZM11.75 4.5a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-.967l-1.03 7.727H13.75a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.743-1.02l1.027-7.707H11a.75.75 0 0 1-.75-.75Z" />
    </svg>
);

export const UnderlineIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M5.5 4.25a.75.75 0 0 1 1.5 0V9a3 3 0 0 0 6 0V4.25a.75.75 0 0 1 1.5 0V9a4.5 4.5 0 0 1-9 0V4.25ZM4 14.25a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75a.75.75 0 0 1-.75-.75Z" />
    </svg>
);

export const StrikethroughIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z" clipRule="evenodd" />
      <path d="M5.443 4.243a.75.75 0 0 1 .813.213l4.25 5.25a.75.75 0 0 1 0 .988l-4.25 5.25a.75.75 0 1 1-1.226-.826L8.85 10.5 5.03 5.28a.75.75 0 0 1 .412-1.037Z" />
      <path d="M14.557 4.243a.75.75 0 0 0-.813.213l-4.25 5.25a.75.75 0 0 0 0 .988l4.25 5.25a.75.75 0 1 0 1.226-.826L11.15 10.5l3.82-5.22a.75.75 0 0 0-.412-1.037Z" />
    </svg>
);


export const ListOrderedIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
);

export const ListUnorderedIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 12h9.75m-9.75 6h9.75M5.25 7.5A.75.75 0 0 1 6 6.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H6a.75.75 0 0 1-.75-.75V7.5Zm0 6A.75.75 0 0 1 6 12.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H6a.75.75 0 0 1-.75-.75v-.008Zm0 6A.75.75 0 0 1 6 18.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H6a.75.75 0 0 1-.75-.75v-.008Z" />
    </svg>
);

export const LinkIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
);

export const AlignLeftIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
    </svg>
);

export const AlignCenterIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-12.75 5.25h9" />
    </svg>
);

export const AlignRightIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

export const TableIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.5-6h15m-15-6h15M3.75 21h16.5M3.75 3h16.5" />
    </svg>
);

export const NotebookIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
);

export const NoteIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);
