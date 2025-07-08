import { useState, useEffect } from 'react';

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userid = localStorage.getItem('userid');
    const username = localStorage.getItem('username') || localStorage.getItem('usernameoremail');
    const firstname = localStorage.getItem('firstname') || '';
    const lastname = localStorage.getItem('lastname') || '';
    const email = localStorage.getItem('email') || '';
    const profileimageurl = localStorage.getItem('profileimageurl') || '';

    if (userid) {
      setCurrentUser({
        id: Number(userid),
        username,
        firstname,
        lastname,
        email,
        profileimageurl
      });
    }
  }, []);

  return { currentUser };
};
