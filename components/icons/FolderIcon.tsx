import React from 'react';

export const FolderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 0A2.25 2.25 0 015.25 7.5h13.5a2.25 2.25 0 012.25 2.25m-16.5 0v6.75a2.25 2.25 0 002.25 2.25h12a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003.75 9.75z" />
  </svg>
);

export const FolderOpenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75v10.125a2.25 2.25 0 002.25 2.25h12a2.25 2.25 0 002.25-2.25v-10.125M15 9.75L12 6.75m0 0l-3 3m3-3v11.25" />
  </svg>
);