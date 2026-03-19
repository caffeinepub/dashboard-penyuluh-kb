import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";

module {
  type ReportKey = (Principal.Principal, Text);

  // Old versions of types
  type OldLaporanRencanaKerja = {
    nomorLaporan : Text;
    tanggal : Text;
    namaKegiatan : Text;
    sasaran : Text;
    indikatorKeberhasilan : Text;
    volume : Text;
    metodeKegiatan : Text;
    lokasiKegiatan : Text;
    waktuPelaksanaan : Text;
    sumberDana : Text;
    keterangan : Text;
    status : {
      #draft;
      #submitted;
    };
    author : Principal.Principal;
  };

  type OldActor = {
    laporan : Map.Map<ReportKey, OldLaporanRencanaKerja>;
  };

  // New versions of types
  type NewLaporanRencanaKerja = {
    nomorLaporan : Text;
    tanggal : Text;
    namaKegiatan : Text;
    sasaran : Text;
    indikatorKeberhasilan : Text;
    volume : Text;
    metodeKegiatan : Text;
    lokasiKegiatan : Text;
    waktuPelaksanaan : Text;
    sumberDana : Text;
    keterangan : Text;
    lampiranIds : [Text];
    status : {
      #draft;
      #submitted;
    };
    author : Principal.Principal;
  };

  type NewActor = {
    laporan : Map.Map<ReportKey, NewLaporanRencanaKerja>;
  };

  public func run(old : OldActor) : NewActor {
    let transformedLaporan = old.laporan.map<ReportKey, OldLaporanRencanaKerja, NewLaporanRencanaKerja>(
      func(_k, oldReport) {
        { oldReport with lampiranIds = [] };
      }
    );
    { laporan = transformedLaporan };
  };
};
