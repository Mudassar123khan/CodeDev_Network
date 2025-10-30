import React from "react";
import "./Footer.css";
import { assets } from "../../assets/assets";
function Footer() {
  return (
    <div className="footer">
      <div className="footer-content">
        <div className="footer-content-left">
          <img src={assets.logo} alt="logo" className="logo"/>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero sed
            voluptatum repellat exercitationem quam nam nisi, vero quaerat dicta
            excepturi, eveniet impedit, temporibus placeat quas quasi pariatur
            modi velit. Ea.
          </p>
          <div className="footer-social-icons">
            <a href="https://www.facebook.com/profile.php?id=61582642790293">
              <img src={assets.facebook_icon} alt="facebook icon" />
            </a>
            <a href="https://www.linkedin.com/in/mohdmudassirkhan/`">
              <img src={assets.linkedin_icon} alt="linkedIn icon" />
            </a>
            <a href="https://x.com/kh35482_khan">
              <img src={assets.twitter_icon} alt="twitter icon" />
            </a>
          </div>
        </div>
        <div className="footer-content-center">
            <h2>COMPANY</h2>
          <ul>
            <li>Home</li>
            <li>About us</li>
            <li>Delivery</li>
            <li>Privacy policy</li>
          </ul>
        </div>
        <div className="footer-content-right">
             <h2>GET IN TOUCH</h2>
          <ul>
            <li>+91 99 999 9999</li>
            <li>wingerfoods12@gmail.com</li>
          </ul>
        </div>
      </div>
      <p className="footer-copyright">
        Copyright 2025 &copy; codedevnetwork.com - All Rights Reserved
      </p>
    </div>
  );
}

export default Footer;
