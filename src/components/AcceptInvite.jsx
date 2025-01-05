import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { acceptInvite } from '../services/projectService';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('token'); // the token from ?token=...
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!inviteToken) {
      setMessage('No invite token provided.');
      return;
    }

    // auto accept
    acceptInvite(inviteToken)
      .then(() => setMessage('You joined the project successfully!'))
      .catch(err => {
        console.error(err);
        setMessage('Invite link invalid or expired.');
      });
  }, [inviteToken]);

  return <div>{message}</div>;
}
