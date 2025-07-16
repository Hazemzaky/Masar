import { Request, Response } from 'express';
import StationTrack from '../models/StationTrack';

export async function getStationTracks(req: Request, res: Response) {
  try {
    const tracks = await StationTrack.find().sort({ lastDispense: -1 });
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

export async function createStationTrack(req: Request, res: Response) {
  try {
    const track = new StationTrack(req.body);
    await track.save();
    res.status(201).json(track);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

export async function updateStationTrack(req: Request, res: Response) {
  try {
    const track = await StationTrack.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!track) return res.status(404).json({ message: 'Not found' });
    res.json(track);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

export async function deleteStationTrack(req: Request, res: Response) {
  try {
    const track = await StationTrack.findByIdAndDelete(req.params.id);
    if (!track) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
} 