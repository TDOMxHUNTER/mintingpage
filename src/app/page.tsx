'use client';

import React, { useState } from "react";
import Image from 'next/image';

export default function MintPage() {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-between py-12 bg-gradient-to-br from-gray-900 to-green-900">
      <header className="w-full flex justify-end pr-12">
        <button className="bg-gray-700 bg-opacity-50 border border-gray-500 px-6 py-3 rounded-lg shadow-lg text-lg font-bold font-cinzel tracking-wider">
          CONNECT WALLET
        </button>
      </header>

      <main className="flex flex-col items-center">
        <h1 className="text-5xl font-bold my-8 font-cinzel tracking-widest">
          VALHALLA’S VAULT - MINT YOUR LEGEND
        </h1>

        <div className="w-full max-w-lg mx-auto border-4 border-yellow-600 rounded-xl overflow-hidden shadow-2xl">
          <video src="/VID_20250923_200105_441.mp4" autoPlay loop muted playsInline className="w-full" />
        </div>

        <div className="flex items-center gap-6 bg-black bg-opacity-40 py-5 px-8 rounded-xl mt-12">
          <span className="text-2xl font-cinzel">QTY:</span>
          <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="text-4xl font-bold">-</button>
          <span className="w-12 text-center text-4xl font-bold">{quantity}</span>
          <button onClick={() => setQuantity(q => q + 1)} className="text-4xl font-bold">+</button>
          <button className="ml-10 px-12 py-5 bg-blue-600 rounded-full text-2xl font-bold shadow-lg hover:bg-blue-700 transition relative animate-glow">
            <span className="relative z-10 font-cinzel">MINT</span>
          </button>
        </div>
      </main>

      <footer className="flex gap-6 mt-8 opacity-70">
        <a href="#"><Image src="/icons/twitter.svg" width={32} height={32} alt="Twitter"/></a>
        <a href="#"><Image src="/icons/discord.svg" width={32} height={32} alt="Discord"/></a>
        <a href="#"><Image src="/icons/globe.svg" width={32} height={32} alt="Web"/></a>
      </footer>
    </div>
  );
}
