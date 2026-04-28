import { NextResponse } from 'next/server'
import { toErrorResponse } from '@/lib/seyf/api-error'
import { buildDashboardViewModel, buildDashboardApiResponse } from '@/lib/seyf/dashboard-view-model'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // For backward compatibility with frontend, we still need the full view model
    const vm = await buildDashboardViewModel()
    
    // Get the new API response format
    const apiResponse = await buildDashboardApiResponse()
    
    // If no active cycle, return the no_active_cycle response
    if ('no_active_cycle' in apiResponse) {
      return NextResponse.json(apiResponse, {
        headers: { 'Cache-Control': 'private, max-age=60' },
      })
    }
    
    // Otherwise, return the combined response with both formats for now
    // In the future, we might want to return only the new format
    const response = {
      // New API format
      capital_working_mxn: apiResponse.capital_working_mxn,
      yield_accrued_mxn: apiResponse.yield_accrued_mxn,
      yield_projected_mxn: apiResponse.yield_projected_mxn,
      max_advance_mxn: apiResponse.max_advance_mxn,
      cycle_end_date: apiResponse.cycle_end_date,
      advance_used: apiResponse.advance_used,
      available_balance_mxn: apiResponse.available_balance_mxn,
      // Legacy fields for backward compatibility
      principalMxn: vm.principalMxn,
      rendimientoMxn: vm.rendimientoMxn,
      adelantableMxn: vm.adelantableMxn,
      puntos: vm.puntos,
      tasaAnual: vm.tasaAnual,
      saldoGastoMxn: vm.saldoGastoMxn,
      saldoNote: vm.saldoNote,
      movementsRecent: vm.movementsRecent,
    }
    
    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    })
  } catch (e) {
    return toErrorResponse(e, 'dashboard')
  }
}
