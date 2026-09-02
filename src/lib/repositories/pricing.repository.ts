import { supabase, supabaseAdmin } from '../supabase';
import { PricingInfo } from '../types';

export const PricingRepository = {
  getPricingInfo: async (knownActiveCount?: number, client?: any): Promise<PricingInfo> => {
    let activeCount = knownActiveCount;
    if (activeCount === undefined) {
      const dbClient = client || supabaseAdmin || supabase;
      const { count } = await dbClient
        .from('users')
        .select('*', { count: 'exact', head: true })
        .in('role', ['TEACHER', 'teacher'])
        .eq('status', 'active');
      activeCount = count || 0;
    }
    const finalActiveCount: number = activeCount ?? 0;
    const offerLimit = 5;
    const isOfferActive = finalActiveCount < offerLimit;
    const remainingSeats = isOfferActive ? offerLimit - finalActiveCount : 0;
    const offerPrice = 50;
    const originalPrice = 100;
    const currentPrice = isOfferActive ? offerPrice : originalPrice;

    return {
      activeCount: finalActiveCount,
      offerLimit,
      isOfferActive,
      remainingSeats,
      currentPrice,
      offerPrice,
      originalPrice,
    };
  },
};
