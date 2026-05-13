package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.modelo.SolicitudProyectoDocumento;

public interface SolicitudProyectoDocumentoRepository
        extends JpaRepository<SolicitudProyectoDocumento, Long> {

    List<SolicitudProyectoDocumento> findBySolicitud_IdSolicitudOrderByIdDocumentoAsc(Integer idSolicitud);

    Optional<SolicitudProyectoDocumento> findBySolicitud_IdSolicitudAndTipoDocumento(
            Integer idSolicitud,
            String tipoDocumento
    );

    boolean existsBySolicitud_IdSolicitudAndTipoDocumento(Integer idSolicitud, String tipoDocumento);
}