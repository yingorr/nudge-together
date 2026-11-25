import { useEffect, useState } from 'react'
import FriendView from './FriendView'

// Whole bar is a toggle: tap to open the list of friends, tap again to close.
// Inside, each friend's row opens/closes their tasks the same way.
export default function FriendsPanel({ friends, focusFriend }) {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem('nudge.friendsOpen') === 'true' } catch { return false }
  })
  const [openFriends, setOpenFriends] = useState({}) // id -> true

  useEffect(() => {
    try { localStorage.setItem('nudge.friendsOpen', String(open)) } catch { /* ignore */ }
  }, [open])

  // "View tasks" from the Friends tab opens the panel on that friend.
  useEffect(() => {
    if (!focusFriend) return
    setOpen(true)
    setOpenFriends((o) => ({ ...o, [focusFriend.id]: true }))
  }, [focusFriend])

  const toggleFriend = (id) => setOpenFriends((o) => ({ ...o, [id]: !o[id] }))

  return (
    <section className="card collapsible">
      <button className="collapse-bar" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>Friends' tasks</span>
        <span className="muted small">
          {friends.length > 0 && `${friends.length} friend${friends.length === 1 ? '' : 's'} `}
          <span className={`chevron ${open ? 'open' : ''}`} aria-hidden="true">▸</span>
        </span>
      </button>

      {open && (
        <div className="collapse-body">
          {friends.length === 0 && (
            <p className="muted small">No friends yet. Add some in the Friends tab.</p>
          )}
          {friends.map((f) => (
            <div key={f.id} className="friend-block">
              <button className="collapse-bar sub" aria-expanded={!!openFriends[f.id]} onClick={() => toggleFriend(f.id)}>
                <span>{f.display_name}</span>
                <span className={`chevron ${openFriends[f.id] ? 'open' : ''}`} aria-hidden="true">▸</span>
              </button>
              {openFriends[f.id] && <FriendView friend={f} />}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
