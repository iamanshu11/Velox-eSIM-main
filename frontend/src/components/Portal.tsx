'use client';

import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: ReactNode;
}

export default function Portal({ children }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  let portalRoot = document.getElementById('modal-portal');
  if (!portalRoot) {
    portalRoot = document.createElement('div');
    portalRoot.id = 'modal-portal';
    portalRoot.style.position = 'fixed';
    portalRoot.style.top = '0';
    portalRoot.style.left = '0';
    portalRoot.style.width = '100%';
    portalRoot.style.height = '100%';
    portalRoot.style.zIndex = '9999';
    portalRoot.style.pointerEvents = 'none';
    document.body.appendChild(portalRoot);
  }

  return createPortal(children, portalRoot);
}
