import React from "react";
import "./Hero.css";

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Decentralized Prediction Market</h1>
        <p>
          Bet on your favorite candidate by purchasing their unique ERC-20 token on Avalanche C-Chain.

        </p>
        <ul>
          <li>
            Each candidate is represented by a distinct token—place your bets accordingly.
          </li>
          <li>
            Buy tokens based on your prediction of who will win the election.
          </li>
          <li>
            After the election, Optimistic Oracle V3 verifies the result and rewards token holders of the winning candidate while burning the rest.
          </li>
        </ul>
      </div>
    </section>
  );
};

export default Hero;