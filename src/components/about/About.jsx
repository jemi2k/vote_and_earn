import React, { useEffect } from "react";
import "./About.css";

const sectionsContent = [
    <>
    <h3>Imagine a world where every vote matters and every prediction shapes the future of democracy</h3> 
    <br /><br />
    <strong>Vote and Earn </strong>leverages blockchain to create a decentralized prediction market on Avalanche C-Chain. It allows users to bet on 
    multiple candidates or events in an election. 
    Each candidate or event is represented by a unique ERC-20 token on C-Chain.
    <br /><br />
  Any user can launch a new market by setting candidate or event names, 
  providing detailed descriptions, and defining reward parameters — all 
  executed seamlessly on-chain. Users engage actively by purchasing tokens 
  corresponding to the candidates or events they support, casting their 
  predictions in a dynamic market environment.
  
 Once real-world outcomes are verified through an Optimistic Oracle, the winning token holders receive rewards, while tokens of the remaining candidates are burned.

<br /><br />

The Optimistic Oracle is a decentralized data verification mechanism developed by UMA. It allows smart contracts to securely and trustlessly access off-chain information by initially accepting submitted data as true — unless a valid dispute is raised within a set liveness period.

<br /><br />

During this period, participants submit outcome assertions along with a bond. If anyone disputes the claim, a resolution process is triggered. Economic incentives and penalties ensure that only well-substantiated challenges succeed.

<br /><br />

Once the liveness period ends without dispute, the Oracle finalizes the result and calls a callback function on the consuming contract to update its state — such as resolving a market and enabling token settlements.

<br /><br />

This creates an efficient, economically self-regulated bridge between off-chain events and on-chain decision-making.

  
  </>,
  <>
    <strong>Join us in reshaping predictive analytics and democratic decision‑making by investing in real outcomes. 
    <br /><br /> 
      Together, We bring Clarity, Integrity, and Accountability to Prediction Markets. </strong>
    <br /><br />
    <strong>Compute For Truth!  <br /><br /> <a href="https://t.me/ermiasbe"> Contact</a> or email - jermijwll@gmail.com</strong>
  </>
];

const About = () => {
  useEffect(() => {
    const sections = document.querySelectorAll(".section");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.3 }
    );
    sections.forEach((section) => observer.observe(section));
    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  return (
    <div className="about-page">
      <div className="scroll-indicator">SCROLL</div>
      {sectionsContent.map((content, index) => {
        // Alternates alignment: left for even index, right for odd index
        const alignment = index % 2 === 0 ? "left" : "right";
        return (
          <div key={index} className={`section ${alignment}`}>
            <div className="card">
              <p>{content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default About;