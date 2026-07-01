export default function DashboardPage() {
  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Dashboard
        </h2>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                8
              </h4>
              <span className="text-sm font-medium">Total Activos</span>
            </div>
          </div>
        </div>
        
        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                8
              </h4>
              <span className="text-sm font-medium">Total Riesgos Registrados</span>
            </div>
          </div>
        </div>
        
        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-red-500">
                3
              </h4>
              <span className="text-sm font-medium">Riesgos Críticos</span>
            </div>
          </div>
        </div>
        
        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-orange-500">
                2
              </h4>
              <span className="text-sm font-medium">Riesgos Altos</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* TODO: Add Charts and Data tables here */}
      <div className="mt-8">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
          <h4 className="mb-4 text-xl font-semibold text-black dark:text-white">
            Resumen del Sistema
          </h4>
          <p className="text-slate-500">
            El dashboard conectará con la base de datos para mostrar las estadísticas en tiempo real y gráficos.
          </p>
        </div>
      </div>
    </>
  );
}
