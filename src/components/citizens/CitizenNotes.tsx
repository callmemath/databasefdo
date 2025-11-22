'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Trash2, Save, X, Shield } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useSession } from 'next-auth/react';

interface Note {
  id: string;
  citizenId: number;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  officer: {
    id: string;
    name: string;
    surname: string;
    badge: string;
    department: string;
    rank: string;
  };
}

interface CitizenNotesProps {
  citizenId: number;
  citizenName: string;
}

export default function CitizenNotes({ citizenId, citizenName }: CitizenNotesProps) {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Carica le note
  useEffect(() => {
    fetchNotes();
  }, [citizenId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/citizens/${citizenId}/notes`);
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento delle note');
      }
      
      const data = await response.json();
      setNotes(data);
    } catch (err) {
      console.error('Errore nel caricamento delle note:', err);
      setError('Impossibile caricare le note');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/citizens/${citizenId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newNoteContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Errore nella creazione della nota');
      }

      const newNote = await response.json();
      setNotes([newNote, ...notes]);
      setNewNoteContent('');
      setIsAddingNote(false);
    } catch (err) {
      console.error('Errore nella creazione della nota:', err);
      alert('Impossibile creare la nota. Riprova.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!editingContent.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editingContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Errore nell\'aggiornamento della nota');
      }

      const updatedNote = await response.json();
      setNotes(notes.map(note => note.id === noteId ? updatedNote : note));
      setEditingNoteId(null);
      setEditingContent('');
    } catch (err) {
      console.error('Errore nell\'aggiornamento della nota:', err);
      alert('Impossibile aggiornare la nota. Riprova.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa nota?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Errore nell\'eliminazione della nota');
      }

      setNotes(notes.filter(note => note.id !== noteId));
    } catch (err) {
      console.error('Errore nell\'eliminazione della nota:', err);
      alert('Impossibile eliminare la nota. Riprova.');
    }
  };

  const startEditingNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500 dark:text-gray-400">Caricamento note...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-gray-500" />
          Note su {citizenName}
        </h3>
        
        {!isAddingNote && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsAddingNote(true)}
          >
            Aggiungi Nota
          </Button>
        )}
      </div>

      {/* Form per aggiungere nuova nota */}
      {isAddingNote && (
        <Card className="p-4 border-2 border-police-blue">
          <div className="space-y-3">
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-police-blue bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-h-[100px]"
              placeholder="Scrivi una nota su questo cittadino..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              disabled={submitting}
            />
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<X className="h-4 w-4" />}
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNoteContent('');
                }}
                disabled={submitting}
              >
                Annulla
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Save className="h-4 w-4" />}
                onClick={handleAddNote}
                disabled={!newNoteContent.trim() || submitting}
              >
                {submitting ? 'Salvataggio...' : 'Salva Nota'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Lista delle note */}
      {notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id} className="p-4">
              {editingNoteId === note.id ? (
                // Modalità modifica
                <div className="space-y-3">
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-police-blue bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-h-[100px]"
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    disabled={submitting}
                  />
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<X className="h-4 w-4" />}
                      onClick={cancelEditing}
                      disabled={submitting}
                    >
                      Annulla
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Save className="h-4 w-4" />}
                      onClick={() => handleEditNote(note.id)}
                      disabled={!editingContent.trim() || submitting}
                    >
                      {submitting ? 'Salvataggio...' : 'Salva'}
                    </Button>
                  </div>
                </div>
              ) : (
                // Modalità visualizzazione
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-police-blue-light dark:bg-police-blue-dark p-2 rounded-full">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {note.officer.name} {note.officer.surname}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>{note.officer.rank} - {note.officer.department}</span>
                          <span>•</span>
                          <span>Matricola: {note.officer.badge}</span>
                        </div>
                      </div>
                    </div>
                    
                    {session?.user?.email && note.officer.id === session.user.id && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEditingNote(note)}
                          className="p-1.5 text-gray-400 hover:text-police-blue hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Modifica nota"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Elimina nota"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-3">
                    {note.content}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Creata: {formatDateTime(note.createdAt)}</span>
                    {note.updatedAt !== note.createdAt && (
                      <span>Modificata: {formatDateTime(note.updatedAt)}</span>
                    )}
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="p-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-md text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Nessuna nota disponibile su questo cittadino.
          </p>
        </div>
      )}
    </div>
  );
}
