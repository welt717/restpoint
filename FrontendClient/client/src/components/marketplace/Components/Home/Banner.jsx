import React, { useState, useEffect, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  ArrowRight,
  Flame,
  Users,
  ShieldCheck,
} from "lucide-react";

// --- Gritty & Bold Animations ---
const revealText = keyframes`
  from { transform: skewX(-15deg) translateX(-30px); opacity: 0; }
  to { transform: skewX(0) translateX(0); opacity: 1; }
`;

const zoomHeavy = keyframes`
  0% { transform: scale(1); }
  100% { transform: scale(1.15); }
`;

// --- Styled Components ---
const Container = styled.div`
  position: relative;
  width: 100%;
  height: 580px;
  overflow: hidden;
  border-radius: 20px;
  background: #0a0a0a;
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.9);
  margin-bottom: 40px;

  @media (max-width: 768px) {
    height: 520px;
    border-radius: 0; /* Full width edge-to-edge feels more "news-like" on mobile */
  }
`;

const Slide = styled.div`
  position: absolute;
  inset: 0;
  opacity: ${(props) => (props.$active ? 1 : 0)};
  z-index: ${(props) => (props.$active ? 2 : 1)};
  transition: opacity 0.6s step-end;
  pointer-events: ${(props) => (props.$active ? "auto" : "none")};
`;

const ImageWrapper = styled.div`
  position: absolute;
  inset: 0;
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      #000 15%,
      rgba(0, 0, 0, 0.4) 50%,
      transparent 100%
    );
    z-index: 1;
  }
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(100%) contrast(1.2) brightness(0.6); /* Gritty Duotone Base */
  animation: ${(props) =>
    props.$active
      ? css`
          ${zoomHeavy} 8s linear forwards
        `
      : "none"};
`;

const Content = styled.div`
  position: absolute;
  left: 6%;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  color: white;
  max-width: 650px;

  & > * {
    opacity: 0;
    animation: ${(props) =>
      props.$active &&
      css`
        ${revealText} 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards
      `};
  }

  .badge {
    animation-delay: 0.1s;
  }
  h1 {
    animation-delay: 0.2s;
  }
  p {
    animation-delay: 0.3s;
  }
  .btn-wrap {
    animation-delay: 0.4s;
  }
`;

const MovementBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #e11d48; /* Sharp Movement Red */
  color: white;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 15px;
  clip-path: polygon(0% 0%, 100% 0%, 95% 100%, 0% 100%);
`;

const Title = styled.h1`
  font-size: 72px;
  font-weight: 900;
  line-height: 0.85;
  margin-bottom: 25px;
  text-transform: uppercase;
  letter-spacing: -2px;

  span {
    display: block;
    color: #e11d48;
    background: none;
    -webkit-text-fill-color: initial;
  }

  @media (max-width: 768px) {
    font-size: 50px;
  }
`;

const Description = styled.p`
  font-size: 18px;
  line-height: 1.4;
  margin-bottom: 35px;
  color: #ccc;
  font-weight: 500;
  max-width: 500px;
  border-left: 4px solid #e11d48;
  padding-left: 20px;
`;

const ActionButton = styled.button`
  background: #e11d48;
  color: white;
  border: none;
  padding: 20px 45px;
  font-size: 16px;
  font-weight: 900;
  text-transform: uppercase;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: 0.2s ease-in-out;

  &:hover {
    background: white;
    color: black;
    transform: scale(1.05);
  }
`;

const ProgressContainer = styled.div`
  position: absolute;
  top: 40px;
  right: 6%;
  display: flex;
  flex-direction: column;
  gap: 15px;
  z-index: 30;
`;

const ProgressStep = styled.div`
  width: 4px;
  height: 40px;
  background: ${(props) =>
    props.$active ? "#e11d48" : "rgba(83, 247, 18, 0.1)"};
  transition: background 0.3s;
`;

const NavOverlay = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  display: flex;
  z-index: 40;
`;

const NavBtn = styled.button`
  background: #000;
  color: white;
  border: none;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.2s;

  &:hover {
    background: #e11d48;
  }
`;

const Banner = () => {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const banners = [
    {
      title: "The People <span>Powered</span>",
      badge: "Movement Store",
      description:
        "This is more than merch. This is your uniform for the frontlines of change. High-durability gear for the people.",
      cta: "Equip Yourself",
      icon: <Users size={16} />,
      image:
        "https://images.unsplash.com/photo-1570126688035-1e6adbd61053?auto=format&fit=crop&q=80&w=1400",
    },
    {
      title: "Wear Your <span>Voice</span>",
      badge: "Grassroots Gear",
      description:
        "Limited release movement apparel. Every item sold funds local community organizing and voter education.",
      cta: "Join The Cause",
      icon: <Flame size={16} />,
      image:
        "https://images.unsplash.com/photo-1551817958-c11933cc4981?auto=format&fit=crop&q=80&w=1400",
    },
    {
      title: "Unapologetic <span>Unity</span>",
      badge: "Siasa Hub Exclusive",
      description:
        "Official Siasa Hub movement protection and apparel. Built for those who lead from the ground up.",
      cta: "Get the Gear",
      icon: <ShieldCheck size={16} />,
      image:
        "https://images.unsplash.com/photo-1540910419892-f0c74b0e8967?auto=format&fit=crop&q=80&w=1400",
    },
  ];

  const next = useCallback(
    () => setCurrent((p) => (p + 1) % banners.length),
    [banners.length],
  );
  const prev = useCallback(
    () => setCurrent((p) => (p === 0 ? banners.length - 1 : p - 1)),
    [banners.length],
  );

  useEffect(() => {
    if (isHovered) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next, isHovered]);

  return (
    <Container
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {banners.map((item, i) => (
        <Slide key={i} $active={i === current}>
          <ImageWrapper>
            <Image src={item.image} $active={i === current} />
          </ImageWrapper>
          <Content $active={i === current}>
            <div className="badge">
              <MovementBadge>
                {item.icon} {item.badge}
              </MovementBadge>
            </div>
            <Title dangerouslySetInnerHTML={{ __html: item.title }} />
            <Description>{item.description}</Description>
            <div className="btn-wrap">
              <ActionButton
                onClick={() => (window.location.href = "/marketplace")}
              >
                {item.cta} <ShoppingBag size={20} />
              </ActionButton>
            </div>
          </Content>
        </Slide>
      ))}

      <ProgressContainer>
        {banners.map((_, i) => (
          <ProgressStep key={i} $active={i === current} />
        ))}
      </ProgressContainer>

      <NavOverlay>
        <NavBtn onClick={prev}>
          <ChevronLeft size={30} />
        </NavBtn>
        <NavBtn onClick={next}>
          <ChevronRight size={30} />
        </NavBtn>
      </NavOverlay>
    </Container>
  );
};

export default Banner;
