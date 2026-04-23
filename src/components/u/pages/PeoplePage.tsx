/**
 * PeoplePage - Contacts & Profiles
 *
 * Features:
 * - Add contacts with wallet addresses
 * - Create your profile (stored locally)
 * - Upload photos
 * - ENS resolution
 * - Address book
 */

import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { UNav } from '../UNav'

interface Person {
  id: string
  name: string
  bio?: string
  avatar?: string
  addresses: {
    chain: string
    address: string
    label?: string
  }[]
  ens?: string
  twitter?: string
  email?: string
  createdAt: number
}

interface Profile extends Person {
  isOwner: true
}

const CHAIN_ICONS: Record<string, string> = {
  eth: '⟠',
  btc: '₿',
  sol: '◎',
  sui: '💧',
  one: '①',
}

export function PeoplePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [contacts, setContacts] = useState<Person[]>([])
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [showAddContactDialog, setShowAddContactDialog] = useState(false)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [showEditContactDialog, setShowEditContactDialog] = useState(false)
  const [selectedContactForAction, setSelectedContactForAction] = useState<Person | null>(null)
  const [editingContact, setEditingContact] = useState<Person | null>(null)
  const [requestAmount, setRequestAmount] = useState('')
  const [requestCurrency, setRequestCurrency] = useState('eth')
  const [requestNote, setRequestNote] = useState('')
  const [newContact, setNewContact] = useState({
    name: '',
    address: '',
    chain: 'eth',
    bio: '',
  })
  const [editProfile, setEditProfile] = useState({
    name: '',
    bio: '',
    twitter: '',
    email: '',
  })

  useEffect(() => {
    const storedProfile = localStorage.getItem('u_profile')
    if (storedProfile) setProfile(JSON.parse(storedProfile))

    const storedContacts = localStorage.getItem('u_contacts')
    if (storedContacts) setContacts(JSON.parse(storedContacts))
  }, [])

  const saveProfile = () => {
    const updated: Profile = {
      id: profile?.id || `profile-${Date.now()}`,
      name: editProfile.name,
      bio: editProfile.bio,
      twitter: editProfile.twitter,
      email: editProfile.email,
      addresses: profile?.addresses || [],
      createdAt: profile?.createdAt || Date.now(),
      isOwner: true,
    }

    setProfile(updated)
    localStorage.setItem('u_profile', JSON.stringify(updated))
    setShowProfileDialog(false)
  }

  const addContact = () => {
    const contact: Person = {
      id: `contact-${Date.now()}`,
      name: newContact.name,
      bio: newContact.bio,
      addresses: [
        {
          chain: newContact.chain,
          address: newContact.address,
        },
      ],
      createdAt: Date.now(),
    }

    const updated = [...contacts, contact]
    setContacts(updated)
    localStorage.setItem('u_contacts', JSON.stringify(updated))
    setShowAddContactDialog(false)
    setNewContact({ name: '', address: '', chain: 'eth', bio: '' })
  }

  return (
    <div className="min-h-screen bg-background">
      <UNav active="people" />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span>👥</span> People
            </h1>
            <p className="text-muted-foreground mt-1">Your profile and contacts</p>
          </div>
          <Button onClick={() => setShowAddContactDialog(true)}>
            <span className="mr-2">+</span>
            Add Contact
          </Button>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Your Profile</TabsTrigger>
            <TabsTrigger value="contacts">
              Contacts
              <Badge variant="secondary" className="ml-2">
                {contacts.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            {!profile ? (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">👤</div>
                <h3 className="text-2xl font-semibold mb-2">Create Your Profile</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Add your name, bio, and connect your wallets. Everything is stored locally - you own your identity.
                </p>
                <Button
                  size="lg"
                  onClick={() => {
                    setEditProfile({ name: '', bio: '', twitter: '', email: '' })
                    setShowProfileDialog(true)
                  }}
                >
                  Create Profile
                </Button>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-6">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={profile.avatar} />
                      <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/60 text-white">
                        {profile.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold">{profile.name}</h2>
                        {profile.ens && <Badge variant="outline">{profile.ens}</Badge>}
                      </div>

                      <p className="text-muted-foreground mb-4">{profile.bio || 'No bio yet'}</p>

                      <div className="flex gap-4 text-sm">
                        {profile.twitter && (
                          <a href={`https://twitter.com/${profile.twitter}`} className="text-blue-500 hover:underline">
                            @{profile.twitter}
                          </a>
                        )}
                        {profile.email && <span className="text-muted-foreground">{profile.email}</span>}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditProfile({
                          name: profile.name,
                          bio: profile.bio || '',
                          twitter: profile.twitter || '',
                          email: profile.email || '',
                        })
                        setShowProfileDialog(true)
                      }}
                    >
                      Edit Profile
                    </Button>
                  </div>

                  {/* Connected Wallets */}
                  <div className="mt-8 pt-6 border-t">
                    <h3 className="font-semibold mb-4">Connected Wallets</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {(() => {
                        // REMOVED: localStorage.getItem('u_wallets') read
                        // TODO: read from IndexedDB via useVault() hook instead
                        // For now, return empty state
                        return (
                          <p className="text-muted-foreground col-span-2">
                            No wallets connected (TODO: migrate to vault)
                          </p>
                        )
                        // const wallets = localStorage.getItem('u_wallets')
                        // if (!wallets) return <p className="text-muted-foreground col-span-2">No wallets connected</p>
                        // return JSON.parse(wallets).map((w: any) => (
                        //   <Card key={w.id}>
                        //     <CardContent className="py-3">
                        //       <div className="flex items-center gap-3">
                        //         <span className="text-xl">{CHAIN_ICONS[w.chain] || '🔗'}</span>
                        //         <div>
                        //           <div className="font-medium">{w.chain.toUpperCase()}</div>
                        //           <code className="text-xs text-muted-foreground">{w.address.slice(0, 12)}...</code>
                        //         </div>
                        //       </div>
                        //     </CardContent>
                        //   </Card>
                        // ))
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts">
            {contacts.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">📇</div>
                <h3 className="text-2xl font-semibold mb-2">No Contacts Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Add contacts to easily send crypto. Save addresses with names so you never have to copy/paste again.
                </p>
                <Button size="lg" onClick={() => setShowAddContactDialog(true)}>
                  <span className="mr-2">+</span>
                  Add First Contact
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contacts.map((contact) => (
                  <Card key={contact.id} className="group hover:shadow-xl transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={contact.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                            {contact.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold">{contact.name}</div>
                          {contact.ens && (
                            <Badge variant="outline" className="text-xs">
                              {contact.ens}
                            </Badge>
                          )}
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{contact.bio || 'No bio'}</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {contact.addresses.map((addr, i) => (
                          <div key={i} className="p-2 bg-muted/50 rounded flex items-center gap-2">
                            <span>{CHAIN_ICONS[addr.chain] || '🔗'}</span>
                            <code className="text-xs flex-1 truncate">{addr.address}</code>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            // Navigate to send page with pre-selected contact
                            const addr = contact.addresses[0]
                            if (addr) {
                              localStorage.setItem(
                                'u_send_prefill',
                                JSON.stringify({
                                  id: contact.id,
                                  type: 'contact',
                                  name: contact.name,
                                  address: addr.address,
                                  chain: addr.chain,
                                  avatar: contact.avatar,
                                }),
                              )
                              window.location.href = '/u/send'
                            }
                          }}
                        >
                          ↗️ Send
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            // Open request dialog with this contact
                            setSelectedContactForAction(contact)
                            setShowRequestDialog(true)
                          }}
                        >
                          ↙️ Request
                        </Button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-muted-foreground"
                          onClick={() => {
                            setEditingContact(contact)
                            setShowEditContactDialog(true)
                          }}
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-muted-foreground"
                          onClick={() => {
                            if (confirm(`Delete ${contact.name}?`)) {
                              const updated = contacts.filter((c) => c.id !== contact.id)
                              setContacts(updated)
                              localStorage.setItem('u_contacts', JSON.stringify(updated))
                            }
                          }}
                        >
                          🗑️ Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Profile</DialogTitle>
            <DialogDescription>This information is stored locally on your device</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                placeholder="Your name"
                value={editProfile.name}
                onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea
                placeholder="Tell us about yourself..."
                value={editProfile.bio}
                onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Twitter</Label>
                <Input
                  placeholder="@username"
                  value={editProfile.twitter}
                  onChange={(e) => setEditProfile({ ...editProfile, twitter: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={editProfile.email}
                  onChange={(e) => setEditProfile({ ...editProfile, email: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfileDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveProfile} disabled={!editProfile.name}>
              Save Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={showAddContactDialog} onOpenChange={setShowAddContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
            <DialogDescription>Save a wallet address with a name for easy access</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                placeholder="Contact name"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Wallet Address</Label>
              <Input
                placeholder="0x... or ENS name"
                value={newContact.address}
                onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
              />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Add any notes..."
                value={newContact.bio}
                onChange={(e) => setNewContact({ ...newContact, bio: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddContactDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addContact} disabled={!newContact.name || !newContact.address}>
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Payment Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Payment</DialogTitle>
            <DialogDescription>Request {selectedContactForAction?.name} to send you crypto</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar>
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  {selectedContactForAction?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{selectedContactForAction?.name}</div>
                <code className="text-xs text-muted-foreground">
                  {selectedContactForAction?.addresses?.[0]?.address.slice(0, 12)}...
                </code>
              </div>
            </div>

            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
              />
            </div>

            <div>
              <Label>Currency</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['eth', 'btc', 'sol', 'usdc'].map((c) => (
                  <button
                    key={c}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      requestCurrency === c ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setRequestCurrency(c)}
                  >
                    <span className="text-lg">{CHAIN_ICONS[c] || '💵'}</span>
                    <div className="text-xs font-medium mt-1">{c.toUpperCase()}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Note (optional)</Label>
              <Textarea
                placeholder="What's this for?"
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRequestDialog(false)
                setRequestAmount('')
                setRequestNote('')
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!requestAmount}
              onClick={() => {
                // Generate a payment request link
                const request = {
                  id: `req-${Date.now()}`,
                  from: selectedContactForAction?.name,
                  to: 'You',
                  amount: requestAmount,
                  currency: requestCurrency,
                  note: requestNote,
                  createdAt: Date.now(),
                  status: 'pending',
                }
                const stored = localStorage.getItem('u_payment_requests') || '[]'
                const requests = JSON.parse(stored)
                localStorage.setItem('u_payment_requests', JSON.stringify([request, ...requests]))

                // Create shareable link (in real app, this would be a deep link)
                const shareText = `Payment request: ${requestAmount} ${requestCurrency.toUpperCase()}${requestNote ? ` - ${requestNote}` : ''}`
                if (navigator.share) {
                  navigator.share({ title: 'Payment Request', text: shareText })
                } else {
                  navigator.clipboard.writeText(shareText)
                  alert('Request copied to clipboard!')
                }

                setShowRequestDialog(false)
                setRequestAmount('')
                setRequestNote('')
              }}
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={showEditContactDialog} onOpenChange={setShowEditContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>Update contact information</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                placeholder="Contact name"
                value={editingContact?.name || ''}
                onChange={(e) => setEditingContact((prev) => (prev ? { ...prev, name: e.target.value } : null))}
              />
            </div>
            <div>
              <Label>Wallet Address</Label>
              <Input
                placeholder="0x... or ENS name"
                value={editingContact?.addresses?.[0]?.address || ''}
                onChange={(e) =>
                  setEditingContact((prev) =>
                    prev
                      ? {
                          ...prev,
                          addresses: [{ ...prev.addresses[0], address: e.target.value }],
                        }
                      : null,
                  )
                }
              />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Add any notes..."
                value={editingContact?.bio || ''}
                onChange={(e) => setEditingContact((prev) => (prev ? { ...prev, bio: e.target.value } : null))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditContactDialog(false)
                setEditingContact(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingContact) {
                  const updated = contacts.map((c) => (c.id === editingContact.id ? editingContact : c))
                  setContacts(updated)
                  localStorage.setItem('u_contacts', JSON.stringify(updated))
                }
                setShowEditContactDialog(false)
                setEditingContact(null)
              }}
              disabled={!editingContact?.name || !editingContact?.addresses?.[0]?.address}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
