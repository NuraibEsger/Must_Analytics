import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { acceptInvite } from '../services/projectService';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    if (!token) {
      setMessage('No token provided.');
      return;
    }
    // auto accept
    acceptInvite(token)
      .then(() => setMessage('You joined the project successfully!'))
      .catch(err => setMessage('Invite link invalid or expired.'));
  }, [token]);

  return <div>{message}</div>;
}
