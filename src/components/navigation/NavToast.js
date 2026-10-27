import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

// Short notices: rerouting, a new route, GPS errors.
const NavToast = () => {
  const toast = useSelector((state) => state.navigation.toast);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), toast.ms);
    return () => clearTimeout(timer);
  }, [toast?.id]);

  return visible && toast ? <div className="nav-toast">{toast.text}</div> : null;
};

export default NavToast;
